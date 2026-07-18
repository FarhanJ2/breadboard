---
title: "A Supabase-backed .wpilog library"
date: 2025-10-08
tags: ["LOG"]
teaser: "Every match leaves a .wpilog on the roboRIO that nobody ever opens again. This pushes them to Supabase, indexed and queryable, so a regression is a query instead of a memory."
stat:
  value: "1.2 GB"
  label: "match logs indexed"
readMins: 6
---

The roboRIO writes a .wpilog every time it powers on, and for most teams that file
lives and dies on the robot. The idea here: treat match logs as a team asset — pull
them off after every event, store them in Supabase, and make the whole history
queryable.
