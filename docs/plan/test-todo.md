# Test TODO

## Export/Import/Build E2E

### Export
1. [x] Export fevm project -> download fevm.forge.zip
2. [x] Unzip and verify: config.json + prompt/ + gen/ all present
3. [ ] Verify genie_room.name is saved in config.json after genie creation

### Import Load
4. [x] Import fevm.forge.zip with "Load project" -> config kept as-is
5. [ ] All setup blocks show same state as before export
6. [x] Prompts in project dir, not shared conf/prompt/

### Import New
7. [x] Import fevm.forge.zip with "New project" -> host/token/warehouse cleared
8. [ ] Schema name preserved, genie_room.name preserved
9. [ ] Connect workspace, set warehouse, set schema
10. [x] Verify all files in projects/{name}/ artifact dir

### Build from Assets tab
11. [x] Click Build -> all 6 steps run
12. [x] Schema created
13. [x] Tables provisioned from project gen/init/ SQL files
14. [x] CSVs loaded from project gen/csv/
15. [ ] Functions created from project gen/func/
16. [x] Procedures created from project gen/proc/
17. [ ] Genie space created with correct name (from genie_room.name, not "Project Data")
18. [ ] MLflow experiment created (coolname was missing, now fixed)
19. [x] No ANSI escape codes in build terminal output (colorize strips them)
20. [x] No animated progress bars in build terminal (isatty guard)
21. [x] Build modal stays open after completion (Close button visible)
22. [ ] After close, setup blocks reflect provisioned assets

### Project scoping
23. [x] Generate data on project A -> files land in projects/A/gen/
24. [ ] Switch to project B -> project A files NOT visible
25. [ ] Generate data on project B -> files land in projects/B/gen/
26. [ ] Switch back to A -> A's files back, B's files NOT visible
27. [x] Export A -> bundle contains A's files only
28. [ ] Create fresh project C -> no prompts, no SQL, no CSVs

### Genie name propagation
29. [ ] Create genie space with custom name -> genie_room.name saved in config
30. [ ] Export project -> genie_room.name in bundle config.json
31. [ ] Import as new -> genie_room.name preserved
32. [ ] Build -> genie space created with the preserved name
