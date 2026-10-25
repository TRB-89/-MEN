"""Train and export a baseline Scikit-learn RandomForestClassifier for network threat detection.

Generates synthetic network flow records representing Benign, Port Scan,
Brute Force, Exploitation, and Lateral Movement traffic, fits a model,
and serializes it to backend/models/threat_detector.joblib.
"""

import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_FILE = os.path.join(MODEL_DIR, "threat_detector.joblib")


def generate_synthetic_training_data(n_samples_per_class=400):
    np.random.seed(42)
    X = []
    y = []

    # 0: BENIGN
    for _ in range(n_samples_per_class):
        port = np.random.choice([80, 443, 53, 123, 8080])
        duration = np.random.uniform(50.0, 5000.0)
        packets = np.random.randint(10, 200)
        bytes_total = packets * np.random.randint(200, 1400)
        entropy = np.random.uniform(3.0, 5.8)
        syn = 1.0
        ack = 1.0
        fin = float(np.random.choice([0, 1]))
        rst = 0.0
        bpp = bytes_total / max(1, packets)
        pps = (packets / max(0.001, duration)) * 1000.0
        X.append([port, duration, packets, bytes_total, entropy, syn, ack, fin, rst, bpp, pps])
        y.append(0)

    # 1: PORT_SCAN
    for _ in range(n_samples_per_class):
        port = np.random.randint(20, 65000)
        duration = np.random.uniform(5.0, 45.0)  # very fast
        packets = np.random.randint(1, 3)        # 1 or 2 packets
        bytes_total = packets * np.random.randint(40, 70)
        entropy = np.random.uniform(1.0, 3.2)
        syn = 1.0
        ack = 0.0
        fin = 0.0
        rst = float(np.random.choice([0, 1]))
        bpp = bytes_total / max(1, packets)
        pps = (packets / max(0.001, duration)) * 1000.0
        X.append([port, duration, packets, bytes_total, entropy, syn, ack, fin, rst, bpp, pps])
        y.append(1)

    # 2: BRUTE_FORCE
    for _ in range(n_samples_per_class):
        port = np.random.choice([22, 3389, 445, 5985])
        duration = np.random.uniform(400.0, 2500.0)
        packets = np.random.randint(50, 400)
        bytes_total = packets * np.random.randint(80, 160)
        entropy = np.random.uniform(3.5, 5.0)
        syn = 1.0
        ack = 1.0
        fin = float(np.random.choice([0, 1]))
        rst = float(np.random.choice([0, 1]))
        bpp = bytes_total / max(1, packets)
        pps = (packets / max(0.001, duration)) * 1000.0
        X.append([port, duration, packets, bytes_total, entropy, syn, ack, fin, rst, bpp, pps])
        y.append(2)

    # 3: EXPLOITATION
    for _ in range(n_samples_per_class):
        port = np.random.choice([80, 443, 8080, 8443, 21])
        duration = np.random.uniform(100.0, 1500.0)
        packets = np.random.randint(15, 80)
        bytes_total = packets * np.random.randint(600, 1500)
        entropy = np.random.uniform(6.8, 7.95)  # High entropy payload / shellcode
        syn = 1.0
        ack = 1.0
        fin = 0.0
        rst = 0.0
        bpp = bytes_total / max(1, packets)
        pps = (packets / max(0.001, duration)) * 1000.0
        X.append([port, duration, packets, bytes_total, entropy, syn, ack, fin, rst, bpp, pps])
        y.append(3)

    # 4: LATERAL_MOVEMENT
    for _ in range(n_samples_per_class):
        port = np.random.choice([445, 139, 5985, 135])
        duration = np.random.uniform(200.0, 3000.0)
        packets = np.random.randint(30, 250)
        bytes_total = packets * np.random.randint(300, 1100)
        entropy = np.random.uniform(4.5, 6.2)
        syn = 1.0
        ack = 1.0
        fin = 0.0
        rst = 0.0
        bpp = bytes_total / max(1, packets)
        pps = (packets / max(0.001, duration)) * 1000.0
        X.append([port, duration, packets, bytes_total, entropy, syn, ack, fin, rst, bpp, pps])
        y.append(4)

    return np.array(X), np.array(y)


def train_and_export():
    os.makedirs(MODEL_DIR, exist_ok=True)
    X, y = generate_synthetic_training_data()
    clf = RandomForestClassifier(n_estimators=50, max_depth=10, random_state=42)
    clf.fit(X, y)
    
    payload = {
        "model": clf,
        "classes": ["BENIGN", "PORT_SCAN", "BRUTE_FORCE", "EXPLOITATION", "LATERAL_MOVEMENT"],
        "features": ["port", "duration", "packets", "bytes", "entropy", "syn", "ack", "fin", "rst", "bpp", "pps"],
    }
    joblib.dump(payload, MODEL_FILE)
    print(f"Model saved successfully to {MODEL_FILE}")


if __name__ == "__main__":
    train_and_export()
