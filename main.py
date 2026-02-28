import os
from datetime import datetime
from typing import Optional

import cv2
import face_recognition
import numpy as np


class AttendanceSystem:
    """A class to handle face recognition-based attendance marking."""

    def __init__(self, known_faces_dir="datas", attendance_file: Optional[str] = None):
        """
        Initializes the attendance system.

        :param known_faces_dir: Directory with known face images.
        :param attendance_file: Path to the CSV for storing attendance.
        """
        self.known_faces_dir = known_faces_dir
        if not attendance_file:
            today = datetime.now().strftime("%Y-%m-%d")
            attendance_file = os.path.join("attendance_data", f"attendance_{today}.csv")
        self.attendance_file = attendance_file
        self.known_face_encodings = []
        self.known_face_names = []
        self._load_known_faces()
        self.todays_attendance = set()

    def _load_known_faces(self):
        """Loads face encodings and names from the known_faces directory."""
        print("Loading known faces...")
        for filename in os.listdir(self.known_faces_dir):
            if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
                continue

            try:
                image_path = os.path.join(self.known_faces_dir, filename)
                image = face_recognition.load_image_file(image_path)
                encodings = face_recognition.face_encodings(image)

                if encodings:
                    self.known_face_encodings.append(encodings[0])
                    # Extract name from filename (e.g., 'Name_index.jpg' -> 'Name')
                    name = os.path.splitext(filename)[0].split("_")[0]
                    self.known_face_names.append(name)
                else:
                    print(f"Warning: No face found in {filename}. Skipping.")
            except Exception as e:
                print(f"Error processing file {filename}: {e}")

        total_faces = len(set(self.known_face_names))
        print(f"Encoding complete. Total faces: {total_faces}")

    def _mark_attendance(self, name):
        """
        Marks attendance for a recognized person.

        It checks if the person has already been marked today to avoid
        duplicates.
        """
        if name in self.todays_attendance:
            return

        with open(self.attendance_file, "a+") as f:
            now = datetime.now()
            dt_string = now.strftime("%Y-%m-%d %H:%M:%S")
            f.writelines(f"{name},{dt_string}\n")
            self.todays_attendance.add(name)
            print(f"✅ Marked attendance for {name} at {dt_string}")

    @staticmethod
    def _draw_face_overlay(frame, face_loc, name):
        top, right, bottom, left = face_loc
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        # Draw a box around the face
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

        # Draw a label with a name below the face
        label_bg_y1 = bottom - 35
        cv2.rectangle(
            frame, (left, label_bg_y1), (right, bottom), (0, 255, 0), cv2.FILLED
        )
        font = cv2.FONT_HERSHEY_DUPLEX
        cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)

    def process_image(self, image, show=True, window_name="Recognized Faces"):
        # Convert image from BGR to RGB
        if isinstance(image, str):
            image = cv2.imread(image)

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        # Detect faces
        face_locations = face_recognition.face_locations(rgb_image)
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        results = []
        for face_encoding, face_loc in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(
                self.known_face_encodings, face_encoding
            )
            name = "Unknown"
            distance = None
            face_distances = face_recognition.face_distance(
                self.known_face_encodings, face_encoding
            )
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                distance = face_distances[best_match_index]
                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
            results.append({"name": name, "location": face_loc, "distance": distance})
            # Draw overlay for each face
            self._draw_face_overlay(image, face_loc, name)
        if show:
            cv2.imshow(window_name, image)
            cv2.waitKey(0)
            cv2.destroyWindow(window_name)
        return results

    def process_camera(self):
        """Starts the video capture and runs the face recognition process."""
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open video stream.")
            return

        while True:
            success, frame = cap.read()
            if not success:
                print("Ignoring empty camera frame.")
                continue

            # Flip the image horizontally for a selfie-view display.
            frame = cv2.flip(frame, 1)
            # Resize frame of video to 1/4 size for faster face recognition
            small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
            # Convert the image from BGR color to RGB color
            rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

            # Find all the faces and face encodings in the current frame
            face_locations = face_recognition.face_locations(rgb_small_frame)
            face_encodings = face_recognition.face_encodings(
                rgb_small_frame, face_locations
            )

            for face_encoding, face_loc in zip(face_encodings, face_locations):
                matches = face_recognition.compare_faces(
                    self.known_face_encodings, face_encoding
                )
                name = "Unknown"

                face_distances = face_recognition.face_distance(
                    self.known_face_encodings, face_encoding
                )
                if len(face_distances) > 0:
                    best_match_index = np.argmin(face_distances)
                    if matches[best_match_index]:
                        name = self.known_face_names[best_match_index]

                self._draw_face_overlay(frame, face_loc, name)

                if name != "Unknown":
                    self._mark_attendance(name)

            cv2.imshow("Attendance System", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        cap.release()
        cv2.destroyAllWindows()

        print("--------------------------------")
        print(
            f"Number of attendance: {len(self.todays_attendance)} / {len(set(self.known_face_names))}"
        )
        attendance_rate = (
            len(self.todays_attendance) / len(set(self.known_face_names)) * 100
        )
        print(f"Attendance rate: {attendance_rate:.2f}%")
        if attendance_rate < 100:
            absentees_names = set(self.known_face_names) - self.todays_attendance
            print(f"Absentees: {absentees_names}")


def main():
    """Main function to run the attendance system."""
    system = AttendanceSystem(known_faces_dir="datas")
    system.process_camera()


if __name__ == "__main__":
    main()
