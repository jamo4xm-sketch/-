# Mid-Tower PC Build (STL)

A full ATX mid-tower gaming PC, modelled at real size in millimetres. Every
part is its own STL, and all of them share one origin, so they line up when
you open them together.

Interactive viewer: https://claude.ai/artifact/6Y7YqmZ7LZMQtMqrwNuKTd

## Files

`stl/` holds one file per part and `full_pc.stl` with the whole machine:

| File | Part |
|---|---|
| case.stl | Mid-tower case: honeycomb front mesh, top vents, rear I/O and 7 expansion slots, PSU shroud, feet |
| glass_panel.stl | Tempered glass side panel with thumbscrews |
| motherboard.stl | ATX board, 305 x 244 x 1.6 mm, with mounting holes |
| motherboard_heatsinks.stl | VRM, chipset and M.2 heatsinks, rear I/O block |
| motherboard_slots.stl | 4 DIMM slots, 2 PCIe x16, PCIe x1, socket frame, 24-pin and 8-pin power, SATA |
| cpu.stl | CPU heat spreader |
| ram.stl | 2 DDR5 sticks |
| cooler_fins.stl, cooler_heatpipes.stl, cooler_fan.stl | 165 mm tower cooler: fin stack, 8 copper heatpipes, 120 mm fan |
| gpu.stl, gpu_fans.stl | 2.5-slot, 300 mm graphics card and its three fans |
| psu.stl | ATX power supply, 150 x 160 x 86 mm |
| drives.stl | 3.5" hard drive and 2.5" SSD |
| fans_front.stl, fans_top.stl, fan_rear.stl | Six 120 mm case fans |

Units are millimetres, Z is up, X runs from the glass side (0) to the
motherboard side (220), Y from the front (0) to the rear (460). Every part is
a closed (watertight) solid.

## 3D printing

At full size the case is 220 x 460 x 510 mm, bigger than most printer beds.
To print a desk model, scale everything by the same amount in your slicer,
for example 20 % for a 10 cm tall PC (a Bambu A1 or P1S bed fits it at up to
about 45 %). Thin parts such as cooler fins (0.8 mm at full size) get too
thin below about 50 %, so print those at a larger scale or thicken them in
`generate.py`.

## Changing the design

`generate.py` builds every part from simple solids with manifold3d and
exports the STLs. Sizes are constants at the top and in each part function.

```bash
pip install manifold3d trimesh numpy
python generate.py
```

`viewer.html` is the source of the interactive viewer; `web/` holds the
compact copies of the parts it loads.
