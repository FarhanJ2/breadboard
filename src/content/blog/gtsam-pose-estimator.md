---
title: "A GTSAM pose estimator for the field"
codename: "ATLAS"
date: 2026-03-15
tags: ["WRITEUP"]
teaser: "Fusing wheel odometry with AprilTag sightings as a factor graph instead of a Kalman filter — and what smoothing the whole trajectory bought us over filtering one step at a time."
stat:
  value: "±2.1 cm"
  label: "pose error, 1σ"
readMins: 12
---

Most FRC pose estimators are a Kalman filter: predict from odometry, correct on each
tag. This project asked a different question — what if we treat the whole match as one
big factor graph and let GTSAM smooth the entire trajectory at once?
