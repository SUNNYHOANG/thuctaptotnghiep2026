import base64
import io
import os
from datetime import datetime

import cv2
import numpy as np
import pandas as pd
import streamlit as st
from PIL import Image
import requests

try:
    import face_recognition  # type: ignore

    HAS_FACE_RECOGNITION = True
except Exception:
    # On Windows/Python 3.11, `face_recognition` often fails to install because `dlib` needs CMake + MSVC.
    face_recognition = None  # type: ignore
    HAS_FACE_RECOGNITION = False

# --- Config ---
DATA_DIR = "datas"
ATTENDANCE_FILE = "Attendance.csv"
ADMIN_PASSWORD = "admin123"
FACE_API_URL = os.getenv("FACE_API_URL", "http://localhost:8001")
DEFAULT_BACKEND = "face_recognition" if HAS_FACE_RECOGNITION else "lbph"
LBPH_THRESHOLD_MAX = 80.0  # Ngưỡng vừa phải (80 = chặt hơn, giảm nhận nhầm)


# --- Helper functions ---
def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


@st.cache_resource
def get_haar_face_detector():
    return cv2.CascadeClassifier(
        os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
    )


@st.cache_resource
def load_known_faces_face_recognition():
    if not HAS_FACE_RECOGNITION:
        return [], []

    encodings = []
    names = []
    _ensure_data_dir()
    for filename in os.listdir(DATA_DIR):
        if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
            continue
        path = os.path.join(DATA_DIR, filename)
        img = face_recognition.load_image_file(path)  # type: ignore[union-attr]
        faces = face_recognition.face_encodings(img)  # type: ignore[union-attr]
        if faces:
            encodings.append(faces[0])
            name = os.path.splitext(filename)[0].split("_")[0]
            names.append(name)
    return encodings, names


@st.cache_resource
def load_known_faces_lbph():
    """
    LBPH backend (OpenCV only): easier to install on Windows, but typically lower accuracy than face_recognition.
    Returns: (model or None, label_to_name dict)
    """
    detector = get_haar_face_detector()
    _ensure_data_dir()

    face_images = []
    labels = []
    label_to_name = {}
    name_to_label = {}

    def largest_box(boxes):
        # boxes: (x,y,w,h)
        return max(boxes, key=lambda b: int(b[2]) * int(b[3]))

    for filename in os.listdir(DATA_DIR):
        if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
            continue

        name = os.path.splitext(filename)[0].split("_")[0]
        if name not in name_to_label:
            name_to_label[name] = len(name_to_label) + 1
            label_to_name[name_to_label[name]] = name

        path = os.path.join(DATA_DIR, filename)
        img_bgr = cv2.imread(path)
        if img_bgr is None:
            continue

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        boxes = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
        if len(boxes) == 0:
            continue

        x, y, w, h = largest_box(boxes)
        roi = gray[y : y + h, x : x + w]
        roi = cv2.resize(roi, (200, 200))

        face_images.append(roi)
        labels.append(name_to_label[name])

    if not face_images:
        return None, {}

    model = cv2.face.LBPHFaceRecognizer_create()
    model.train(face_images, np.array(labels))
    return model, label_to_name


def mark_attendance(name):
    """
    Ghi nhận điểm danh:
    - Gửi về API Node.js của hệ thống chính (nếu cấu hình)
    - Đồng thời append vào file CSV cục bộ để backup.
    """
    now = datetime.now()
    dt_string = now.strftime("%Y-%m-%d %Y-%m-%d %H:%M:%S")

    # Gửi về API attendance của backend Node (nếu có cấu hình URL)
    api_url = os.getenv("ATTENDANCE_API_URL", "http://localhost:5000/api/attendance")
    mssv = name  # giả định tên trong datas/ chính là mã số sinh viên
    try:
        requests.post(
            api_url,
            json={
                "mssv": mssv,
                "hoten": None,
                "method": "face",
                "time": dt_string,
                "note": "Face attendance from app1.py",
            },
            timeout=3,
        )
    except Exception:
        # Không dừng app nếu backend không chạy
        pass

    # Ghi file CSV cục bộ như cũ
    with open(ATTENDANCE_FILE, "a+") as f:
        f.write(f"{name},{dt_string}\n")


def get_attendance_df():
    if not os.path.exists(ATTENDANCE_FILE):
        return pd.DataFrame(columns=["Name", "Time"])
    df = pd.read_csv(ATTENDANCE_FILE, names=["Name", "Time"], on_bad_lines="skip")
    return df


def save_face_image(name, image):
    _ensure_data_dir()
    count = 1
    for filename in os.listdir(DATA_DIR):
        if filename.startswith(name + "_"):
            count += 1
    save_path = os.path.join(DATA_DIR, f"{name}_{count}.jpg")
    image.save(save_path)


def delete_face_images(name):
    _ensure_data_dir()
    for filename in os.listdir(DATA_DIR):
        if filename.startswith(name + "_"):
            os.remove(os.path.join(DATA_DIR, filename))


def list_face_names():
    _ensure_data_dir()
    names = set()
    for filename in os.listdir(DATA_DIR):
        if filename.lower().endswith((".png", ".jpg", ".jpeg")):
            name = os.path.splitext(filename)[0].split("_")[0]
            names.add(name)
    return sorted(list(names))


def recognize_via_face_api(pil_image, flip_webcam=False):
    """
    Gọi face_api để nhận diện. Trả về (identifier, error_msg).
    flip_webcam=False cho ảnh từ Streamlit camera (không mirror).
    """
    buf = io.BytesIO()
    pil_image.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode()
    try:
        resp = requests.post(
            f"{FACE_API_URL}/recognize",
            json={"image_base64": b64, "flip_webcam": flip_webcam},
            timeout=5,
        )
        data = resp.json()
        if resp.status_code == 200 and data.get("identifier"):
            return data["identifier"], None
        return None, data.get("error", "Không nhận diện được")
    except requests.exceptions.ConnectionError:
        return None, f"Không kết nối được Face API ({FACE_API_URL}). Chạy: python face_api.py"
    except Exception as ex:
        return None, str(ex)


def recognize_frame_via_face_api(frame_bgr, flip_webcam=False):
    """Chuyển frame cv2 (BGR) thành PIL và gọi face_api."""
    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb)
    return recognize_via_face_api(pil_img, flip_webcam=flip_webcam)


def recognize_single_face_from_rgb(
    rgb_image: np.ndarray,
    *,
    backend: str,
    fr_known_encodings=None,
    fr_known_names=None,
    fr_tolerance: float = 0.5,
    lbph_model=None,
    lbph_label_to_name=None,
    lbph_conf_threshold: float = 70.0,
):
    """
    Return (name, score) if matched, else ("Unknown", None/score).

    - face_recognition backend: score = distance (lower is better)
    - lbph backend: score = confidence (lower is better)
    """
    if backend == "face_recognition":
        if not HAS_FACE_RECOGNITION:
            return "Unknown", None

        face_locations = face_recognition.face_locations(rgb_image)  # type: ignore[union-attr]
        if not face_locations:
            return "Unknown", None

        def area(loc):
            top, right, bottom, left = loc
            return max(0, bottom - top) * max(0, right - left)

        best_loc = max(face_locations, key=area)
        encs = face_recognition.face_encodings(rgb_image, [best_loc])  # type: ignore[union-attr]
        if not encs:
            return "Unknown", None

        face_encoding = encs[0]
        if not fr_known_encodings:
            return "Unknown", None

        distances = face_recognition.face_distance(fr_known_encodings, face_encoding)  # type: ignore[union-attr]
        best_idx = int(np.argmin(distances))
        best_dist = float(distances[best_idx])
        if best_dist <= fr_tolerance:
            return fr_known_names[best_idx], best_dist
        return "Unknown", best_dist

    if backend == "lbph":
        if lbph_model is None or not lbph_label_to_name:
            return "Unknown", None

        detector = get_haar_face_detector()
        bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        boxes = detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
        if len(boxes) == 0:
            return "Unknown", None

        x, y, w, h = max(boxes, key=lambda b: int(b[2]) * int(b[3]))
        roi = gray[y : y + h, x : x + w]
        roi = cv2.resize(roi, (200, 200))
        label, conf = lbph_model.predict(roi)
        conf = float(conf)
        if conf <= lbph_conf_threshold:
            return lbph_label_to_name.get(int(label), "Unknown"), conf
        return "Unknown", conf

    return "Unknown", None


# --- Streamlit UI ---
st.set_page_config(page_title="Face Attendance System", layout="wide")
st.title("📸 Hệ thống điểm danh bằng khuôn mặt")

if "authenticated" not in st.session_state:
    st.session_state.authenticated = False
if "auth_user" not in st.session_state:
    st.session_state.auth_user = None

st.sidebar.caption("🎯 Nhận diện: Face API (chung với web)")

if st.session_state.authenticated:
    menu = ["Điểm danh", "Lịch sử điểm danh", "Quản lý dữ liệu (Admin)", "Đăng xuất"]
else:
    menu = ["Đăng nhập bằng khuôn mặt", "Quản lý dữ liệu (Admin)"]

choice = st.sidebar.selectbox("Chọn chức năng", menu)

if choice == "Đăng xuất":
    st.session_state.authenticated = False
    st.session_state.auth_user = None
    st.success("Đã đăng xuất.")
    st.rerun()

elif choice == "Đăng nhập bằng khuôn mặt":
    st.header("Đăng nhập bằng nhận diện khuôn mặt")
    st.write("Chụp ảnh từ camera — nhận diện qua **Face API** (đồng bộ với đăng nhập web).")
    st.caption(f"Face API: `{FACE_API_URL}`")
    st.warning(
        "Nếu bạn mở app bằng **địa chỉ IP** (vd `http://192.168.x.x:8502`) thì trình duyệt có thể **không cho phép bật camera**.\n\n"
        "Hãy mở bằng **`http://localhost:8502`** trên chính máy đang có webcam, hoặc cấu hình **HTTPS** nếu muốn truy cập từ máy khác."
    )

    cam = st.camera_input("Chụp ảnh để đăng nhập")

    if cam is not None:
        pil_img = Image.open(cam).convert("RGB")
        # Gọi face_api (flip_webcam=False vì Streamlit camera không mirror)
        name, err = recognize_via_face_api(pil_img, flip_webcam=False)

        if err:
            st.error(err)
        else:
            # Gọi API backend để lấy thông tin user + role
            api_url = os.getenv("FACE_LOGIN_API_URL", "http://localhost:5000/api/auth/face-login")
            user_info = None
            try:
                resp = requests.post(api_url, json={"identifier": name}, timeout=3)
                if resp.status_code == 200:
                    user_info = resp.json()
                else:
                    st.warning(
                        f"Đã nhận diện được {name}, nhưng backend không tìm thấy user tương ứng. "
                        f"({resp.status_code}: {resp.text})"
                    )
            except Exception as ex:
                st.warning(f"Đã nhận diện {name} nhưng không kết nối được backend: {ex}")

            st.session_state.authenticated = True
            st.session_state.auth_user = name

            if user_info and isinstance(user_info, dict) and "user" in user_info:
                role = user_info["user"].get("role", "unknown")
                token = user_info.get("access_token")
                st.success(f"Đăng nhập thành công: {name} (role: {role})")
                if token:
                    st.caption(f"Token đăng nhập: {token}")
            else:
                st.success(f"Đăng nhập thành công: {name}")

            st.rerun()

elif choice == "Điểm danh":
    if not st.session_state.authenticated:
        st.warning("Bạn cần đăng nhập bằng khuôn mặt trước.")
        st.stop()

    st.header("Điểm danh bằng webcam")
    st.info(f"Đang đăng nhập với tài khoản: **{st.session_state.auth_user}**")
    st.markdown(
        """
        <style>
        .big-success {font-size: 2em; color: #27ae60; font-weight: bold;}
        .marked-list {background: #f0f9ff; border-radius: 8px; padding: 10px;}
        </style>
    """,
        unsafe_allow_html=True,
    )
    st.caption(f"Face API: `{FACE_API_URL}` — Nhận diện chung với đăng nhập web.")
    run = st.checkbox("Bắt đầu camera")
    FRAME_WINDOW = st.image([])
    marked = set()
    marked_info = []
    last_marked = st.empty()
    all_names = set(list_face_names())
    if run:
        detector = get_haar_face_detector()
        cap = cv2.VideoCapture(0)
        frame_count = 0
        last_name = None
        last_name_show_frames = 0
        while run:
            ret, frame = cap.read()
            if not ret:
                st.warning("Không thể truy cập camera!")
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            boxes = detector.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
            )

            display_name = "Unknown"
            if boxes:
                frame_count += 1
                if frame_count % 12 == 0:
                    name, _ = recognize_frame_via_face_api(frame, flip_webcam=False)
                    if name:
                        last_name = name
                        last_name_show_frames = 18
                    else:
                        last_name = None
                if last_name and last_name_show_frames > 0:
                    display_name = last_name
                    last_name_show_frames -= 1

                x, y, w, h = max(boxes, key=lambda b: int(b[2]) * int(b[3]))
                color = (0, 255, 0) if display_name != "Unknown" else (0, 0, 255)
                cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
                cv2.rectangle(frame, (x, y + h - 35), (x + w, y + h), color, cv2.FILLED)
                cv2.putText(
                    frame, display_name, (x + 6, y + h - 6),
                    cv2.FONT_HERSHEY_DUPLEX, 1.0, (255, 255, 255), 1
                )

                if display_name != "Unknown" and display_name not in marked:
                    mark_attendance(display_name)
                    marked.add(display_name)
                    avatar_path = None
                    for filename in os.listdir(DATA_DIR):
                        if filename.startswith(display_name + "_"):
                            avatar_path = os.path.join(DATA_DIR, filename)
                            break
                    now = datetime.now().strftime("%H:%M:%S")
                    marked_info.append({"name": display_name, "time": now, "avatar": avatar_path})
                    with last_marked.container():
                        st.balloons()
                        st.markdown(
                            f'<div class="big-success">🎉 Đã điểm danh: {display_name}!</div>',
                            unsafe_allow_html=True,
                        )
                        if avatar_path:
                            st.image(avatar_path, width=120, caption=display_name)
                        st.write(f"⏰ Thời gian: {now}")

            FRAME_WINDOW.image(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            st.markdown('<div class="marked-list">', unsafe_allow_html=True)
            st.subheader(f"✅ Đã điểm danh ({len(marked)}/{len(all_names)})")
            for info in marked_info:
                st.write(f"- **{info['name']}** - {info['time']}")
            st.markdown("</div>", unsafe_allow_html=True)
        cap.release()

elif choice == "Lịch sử điểm danh":
    if not st.session_state.authenticated:
        st.warning("Bạn cần đăng nhập bằng khuôn mặt trước.")
        st.stop()

    st.header("Lịch sử điểm danh")
    df = get_attendance_df()
    st.dataframe(df)
    st.download_button(
        label="Tải file CSV",
        data=df.to_csv(index=False).encode("utf-8"),
        file_name="Attendance.csv",
        mime="text/csv",
    )

elif choice == "Quản lý dữ liệu (Admin)":
    st.header("Quản lý dữ liệu khuôn mặt (Admin)")
    password = st.text_input("Nhập mật khẩu admin", type="password")
    if password == ADMIN_PASSWORD:
        tab1, tab2 = st.tabs(["Thêm người mới", "Xóa người"])
        with tab1:
            st.subheader("Thêm người mới")
            name = st.text_input("Tên người dùng (không dấu, không khoảng trắng)")
            img_file = st.file_uploader(
                "Tải ảnh khuôn mặt (jpg/png)", type=["jpg", "jpeg", "png"]
            )
            if st.button("Thêm ảnh"):
                if name and img_file:
                    image = Image.open(img_file).convert("RGB")
                    save_face_image(name, image)
                    try:
                        requests.post(f"{FACE_API_URL}/reload", timeout=3)
                    except Exception:
                        pass
                    st.success(f"Đã thêm ảnh cho {name}. Face API sẽ reload khi thêm mới.")
                else:
                    st.warning("Vui lòng nhập tên và chọn ảnh!")
        with tab2:
            st.subheader("Xóa người dùng")
            all_names = list_face_names()
            del_name = st.selectbox("Chọn người để xóa", all_names)
            if st.button("Xóa toàn bộ ảnh của người này"):
                delete_face_images(del_name)
                try:
                    requests.post(f"{FACE_API_URL}/reload", timeout=3)
                except Exception:
                    pass
                st.success(f"Đã xóa toàn bộ ảnh của {del_name}")
    elif password:
        st.error("Sai mật khẩu!")
    else:
        st.info("Vui lòng nhập mật khẩu để truy cập chức năng quản trị.")
