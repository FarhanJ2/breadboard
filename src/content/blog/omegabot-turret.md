---
title: "Vision-locking the OMEGABOT turret"
codename: "OMEGABOT"
date: 2026-07-10
tags: ["WRITEUP"]
teaser: "A Limelight, a distance lookup table, and a motion-profiled azimuth — how the shooter learned to keep its aim while the whole robot was moving."
stat:
  value: "0.68"
  label: "p(hit) @ 4 m"
readMins: 17
featured: true
freshInk: true
---

The turret's whole job is to make the drive team stop thinking about aiming. Point
the robot roughly downfield, hold the trigger, and the shot should already be solved.

Getting there meant three loops running at once: a vision loop that turns AprilTags
into a range and bearing, a control loop that slews the azimuth onto that bearing
with a motion profile, and a feedforward that leans the shot ahead of the robot's own
velocity so a moving base doesn't throw the ball wide.

<!-- full write-up continues -->
