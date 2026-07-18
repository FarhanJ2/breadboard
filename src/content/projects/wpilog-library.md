---
title: ".wpilog team library"
codename: "LOGVAULT"
blurb: "Match logs used to live and die on the roboRIO. This pulls every .wpilog into Supabase, indexed and queryable, so debugging a regression is a query instead of a memory."
year: "2025"
status: "active"
category: "tools"
tech: ["Python", "Supabase", "Postgres", "WPILib"]
stat:
  value: "1.2 GB"
  label: "logs indexed"
order: 30
links:
  github: "https://github.com/farhanj2/logvault"
---

The roboRIO writes a `.wpilog` every time it powers on, and for most teams that file
lives and dies on the robot. LOGVAULT treats match logs as a team asset.

## The pipeline

After every event, logs get pulled off the roboRIO, parsed, and pushed into Supabase.
Once they're in Postgres, the whole season's history is queryable — so a regression
becomes a query instead of a memory of "didn't this happen at districts?"
