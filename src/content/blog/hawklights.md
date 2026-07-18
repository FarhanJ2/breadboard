---
title: "HawkLights: a Pico-driven driver station"
codename: "HAWKLIGHTS"
date: 2026-05-02
tags: ["WRITEUP", "LOG"]
teaser: "A Raspberry Pi Pico, a strip of WS2812B, and a serial link to the robot — turning match state into something the drive team can read without looking away from the field."
stat:
  value: "72 px"
  label: "WS2812B @ 60 fps"
readMins: 9
---

The drive team was reading match state off a laptop dashboard mid-match — which is
exactly the moment you can't afford to look at a laptop. HawkLights moves that state
onto the driver station itself: a strip of addressable LEDs that shifts color and
pattern with what the robot is doing.
