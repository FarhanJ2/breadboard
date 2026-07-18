---
title: "GTSAM pose estimator"
codename: "ATLAS"
blurb: "Field localization as a factor graph instead of a Kalman filter — fusing wheel odometry and AprilTag sightings, then smoothing the whole trajectory at once with GTSAM."
year: "2026"
status: "research"
category: "tools"
tech: ["C++", "GTSAM", "Factor graphs", "AprilTags"]
stat:
  value: "±2.1 cm"
  label: "pose error, 1σ"
order: 40
links:
  github: "https://github.com/farhanj2/atlas-estimator"
---

Most FRC pose estimators are a Kalman filter: predict from odometry, correct on each
tag. ATLAS asks a different question — what if the whole match is one factor graph, and
GTSAM smooths the entire trajectory at once?

## Why smoothing beats filtering

A filter commits to each estimate as it goes. A smoother can revisit earlier poses when
a later tag sighting contradicts them, so a late correction propagates backward through
the trajectory instead of only forward.

> Add trajectory plots and error charts here.
