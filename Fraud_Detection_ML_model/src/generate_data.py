import pandas as pd
import numpy as np

np.random.seed(42)
n = 5000

data = []

for _ in range(n):
    # Random features
    distance = np.random.uniform(0, 10)
    gps_variance = np.random.uniform(0, 1)
    motion = np.random.uniform(0, 1)
    idle_time = np.random.randint(0, 7200)
    claims = np.random.randint(0, 10)
    ip_score = np.random.uniform(0, 1)
    event_match = np.random.uniform(0, 1)
    cluster = np.random.uniform(0, 1)

    # Fraud logic (synthetic rules)
    fraud = 0

    if motion < 0.2 and gps_variance < 0.05:
        fraud = 1
    if claims > 5 and ip_score > 0.8:
        fraud = 1
    if cluster > 0.7:
        fraud = 1

    data.append([
        distance, gps_variance, motion, idle_time,
        claims, ip_score, event_match, cluster, fraud
    ])

columns = [
    "distance_from_event", "gps_variance", "motion_score",
    "idle_time", "claims_last_7_days", "ip_stability_score",
    "event_match_score", "cluster_score", "label"
]

df = pd.DataFrame(data, columns=columns)
df.to_csv("data/dataset.csv", index=False)

print("Dataset created!")