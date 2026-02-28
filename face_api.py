"""
Face Recognition API - Dùng cho đăng nhập bằng khuôn mặt.
Chạy độc lập trên port 8001, nhận ảnh base64 và trả về identifier (mssv/username).

ĐÃ ĐỒNG NHẤT VỚI app1.py:
- Dùng LBPH cố định (DEFAULT_BACKEND = "lbph")
- Tham số detectMultiScale: scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
- Ngưỡng LBPH_CONF_THRESHOLD = 60.0 (cùng mức với app1.py)
"""

import base64
import os
import io

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

try:
    import face_recognition  # không dùng trong LBPH nhưng giữ để sau này mở rộng

    HAS_FACE_RECOGNITION = True
except Exception:
    face_recognition = None
    HAS_FACE_RECOGNITION = False

# --- Config ---
DATA_DIR = os.path.join(os.path.dirname(__file__), "datas")

# ĐỂ ĐỒNG NHẤT VỚI STREAMLIT + WINDOWS: ép dùng LBPH
DEFAULT_BACKEND = "lbph"

FR_TOLERANCE = 0.5
LBPH_CONF_THRESHOLD = 70.0  # cùng mức với app1.py (chặt, đỡ nhận nhầm)

app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
)

# --- Cache (load once at startup) ---
_haar_detector = None
_fr_encodings = None
_fr_names = None
_lbph_model = None
_lbph_label_to_name = None


def get_haar_face_detector():
    global _haar_detector
    if _haar_detector is None:
        _haar_detector = cv2.CascadeClassifier(
            os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        )
    return _haar_detector


def load_known_faces():
    """
    Load dữ liệu khuôn mặt từ thư mục datas/.

    - Nếu sau này muốn dùng face_recognition, có thể mở lại nhánh đó.
    - Hiện tại ép dùng LBPH cho giống app1.py (LBPH backend).
    """
    global _fr_encodings, _fr_names, _lbph_model, _lbph_label_to_name

    os.makedirs(DATA_DIR, exist_ok=True)

    # LBPH backend (giống app1.py: load_known_faces_lbph)
    detector = get_haar_face_detector()
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
        boxes = detector.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )
        if len(boxes) == 0:
            continue

        x, y, w, h = largest_box(boxes)
        roi = gray[y : y + h, x : x + w]
        roi = cv2.resize(roi, (200, 200))

        face_images.append(roi)
        labels.append(name_to_label[name])

    if not face_images:
        _lbph_model = None
        _lbph_label_to_name = {}
        return

    model = cv2.face.LBPHFaceRecognizer_create()
    model.train(face_images, np.array(labels))
    _lbph_model = model
    _lbph_label_to_name = label_to_name


def recognize_single_face(rgb_image: np.ndarray):
    """
    Nhận diện khuôn mặt, trả về (identifier, None) hoặc (None, error_msg).

    ĐÃ ÉP DÙNG LBPH giống app1.py:
    - detectMultiScale(scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
    - Ngưỡng LBPH_CONF_THRESHOLD = 60.0
    """
    # LBPH
    if _lbph_model is None or not _lbph_label_to_name:
        return None, "Chưa có dữ liệu khuôn mặt"

    detector = get_haar_face_detector()
    bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    boxes = detector.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
    )
    if len(boxes) == 0:
        return None, "Không phát hiện khuôn mặt"

    x, y, w, h = max(boxes, key=lambda b: int(b[2]) * int(b[3]))
    roi = gray[y : y + h, x : x + w]
    roi = cv2.resize(roi, (200, 200))
    label, conf = _lbph_model.predict(roi)
    conf = float(conf)

    if conf <= LBPH_CONF_THRESHOLD:
        return _lbph_label_to_name.get(int(label), None), None

    return None, "Khuôn mặt không khớp với dữ liệu đã đăng ký"


def base64_to_rgb(data_url_or_base64: str) -> np.ndarray:
    """Chuyển data URL hoặc base64 thuần thành numpy RGB."""
    s = data_url_or_base64.strip()
    if s.startswith("data:"):
        # data:image/jpeg;base64,XXXX
        if "," in s:
            s = s.split(",", 1)[1]
    raw = base64.b64decode(s)
    img = Image.open(io.BytesIO(raw))
    return np.array(img.convert("RGB"))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "backend": DEFAULT_BACKEND})


@app.route("/reload", methods=["POST"])
def reload():
    """Reload dữ liệu khuôn mặt (sau khi thêm/xóa ảnh trong datas/)."""
    try:
        load_known_faces()
        return jsonify({"status": "ok", "message": "Đã reload dữ liệu khuôn mặt"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/recognize", methods=["POST"])
def recognize():
    """
    Nhận ảnh base64 (hoặc data URL), trả về identifier (mssv/username).

    - flip_webcam=True: ảnh từ webcam web (React) bị mirror → lật ngang
    - flip_webcam=False: ảnh từ Streamlit (camera_input) → giữ nguyên
    """
    try:
        data = request.get_json() or {}
        img_b64 = data.get("image_base64") or data.get("image")
        if not img_b64:
            return jsonify({"error": "Thiếu image_base64"}), 400

        rgb = base64_to_rgb(img_b64)
        flip_webcam = bool(data.get("flip_webcam", True))

        if flip_webcam:
            rgb = np.fliplr(rgb).copy()

        identifier, err = recognize_single_face(rgb)
        if identifier:
            return jsonify({"identifier": identifier})

        return jsonify(
            {"error": err or "Không nhận diện được. Đưa mặt vào khung, đảm bảo ánh sáng tốt."}
        ), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    load_known_faces()
    app.run(host="0.0.0.0", port=8001, debug=False)