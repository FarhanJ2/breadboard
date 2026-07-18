---
title: "HawkLights"
codename: "HAWKLIGHTS"
blurb: "A driver-station light system: a Pi Pico driving addressable LEDs off the robot's serial feed, so the drive team reads match state without glancing at a laptop."
year: "2025"
status: "shipped"
category: "robot"
tech: ["RP2040", "C", "WS2812B", "Serial"]
stat:
  value: "72 px"
  label: "@ 60 fps"
order: 10
links:
  github: "https://github.com/steelhawks/hawklights"
---

The drive team was reading match state off a laptop dashboard mid-match — exactly the
moment you can't afford to look away from the field. HawkLights moves that state onto
the driver station itself.

## How it works

A Raspberry Pi Pico listens to a serial feed from the robot and drives a strip of
WS2812B LEDs. Match state — intake full, shot ready, climb armed — maps to color and
pattern the driver can read from the corner of their eye.

> Add photos of the wiring and the finished strip here — drop image files next to this
> file and reference them with `![alt](./filename.jpg)`.
