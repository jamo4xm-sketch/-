"""Build ready-to-slice Bambu Studio project files (.3mf) for the Bambu Lab P2S, 0.4 nozzle, PLA.

Two variants:
  * *_AMS.3mf     : 2 filaments (1 = black, 2 = white). The filament changes to white automatically at layer 9 (Z 1.6 mm -> 1.8).
  * *_noAMS.3mf   : 1 filament (black). The printer pauses before layer 9 so you can load the white filament by hand.

Settings are flattened from Bambu Studio's official system profiles
(resources/profiles/BBL in https://github.com/bambulab/BambuStudio), path passed with --profiles.

Usage: python3 make_bambu_3mf.py --profiles /path/to/BambuStudio/resources/profiles/BBL [--stl out/keychain_single.stl]
"""
import argparse, glob, json, os, uuid, zipfile, datetime
import trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
PRINTER = "Bambu Lab P2S 0.4 nozzle"
PROCESS = "0.20mm Standard @BBL P2S"
FILAMENT = "Bambu PLA Basic @BBL P2S"
APP_VERSION = "02.03.00.70"
CHANGE_Z = 1.8           # top Z of the first white layer (layer 9)
BLACK, WHITE = "#000000", "#FFFFFF"

PROCESS_OVERRIDES = {
    "layer_height": "0.2",
    "initial_layer_print_height": "0.2",
    "wall_loops": "2",
    "top_shell_layers": "4",
    "bottom_shell_layers": "3",
    "sparse_infill_density": "15%",
    "enable_support": "0",
    "brim_type": "no_brim",
    "enable_prime_tower": "0",
    "ironing_type": "top",
}
META_KEYS = {"type", "from", "instantiation", "setting_id", "include", "inherits", "name",
             "description", "renamed_from", "filament_id"}


def load_profiles(root):
    by_name = {}
    for sub in ("machine", "process", "filament"):
        for f in glob.glob(os.path.join(root, sub, "*.json")):
            with open(f, encoding="utf-8") as fh:
                d = json.load(fh)
            if "name" in d:
                by_name[d["name"]] = d
    return by_name


def flatten(name, profiles):
    d = profiles[name]
    out = flatten(d["inherits"], profiles) if d.get("inherits") else {}
    for inc in d.get("include", []):
        out.update({k: v for k, v in flatten(inc, profiles).items()})
    out.update({k: v for k, v in d.items() if k not in META_KEYS})
    return out


def project_config(profiles, n_filaments, colours):
    machine = flatten(PRINTER, profiles)
    process = flatten(PROCESS, profiles)
    process.update(PROCESS_OVERRIDES)
    filament = flatten(FILAMENT, profiles)
    fil_id = profiles[FILAMENT].get("filament_id") or flatten_raw_key(FILAMENT, profiles, "filament_id")

    cfg = {}
    cfg.update(machine)
    cfg.update(process)
    for k, v in filament.items():
        if isinstance(v, list):
            cfg[k] = v * n_filaments  # one copy of the filament's values per filament slot
        else:
            cfg[k] = v
    cfg["filament_colour"] = colours
    cfg["filament_settings_id"] = [FILAMENT] * n_filaments
    cfg["filament_ids"] = [fil_id] * n_filaments
    cfg["print_settings_id"] = PROCESS
    cfg["printer_settings_id"] = PRINTER
    cfg["printer_model"] = machine.get("printer_model", "Bambu Lab P2S")
    cfg["inherits"] = PROCESS
    cfg["inherits_group"] = [PROCESS] + [FILAMENT] * n_filaments + [PRINTER]
    changed = ";".join(sorted(PROCESS_OVERRIDES))
    cfg["different_settings_to_system"] = [changed] + [""] * n_filaments + [""]
    cfg["from"] = "project"
    cfg["name"] = "project_settings"
    # purge volume from black to white is the one place filament is wasted
    if n_filaments == 2:
        cfg["flush_volumes_matrix"] = ["0", "500", "180", "0"]
        cfg["flush_volumes_vector"] = ["140", "140", "140", "140"]
    else:
        cfg["flush_volumes_matrix"] = ["0"]
        cfg["flush_volumes_vector"] = ["140", "140"]
    cfg["flush_multiplier"] = cfg.get("flush_multiplier", ["1"])
    return cfg


def flatten_raw_key(name, profiles, key):
    d = profiles[name]
    if key in d:
        return d[key]
    return flatten_raw_key(d["inherits"], profiles, key) if d.get("inherits") else ""


def mesh_xml(mesh):
    v = "\n".join(f'     <vertex x="{x:.5f}" y="{y:.5f}" z="{z:.5f}"/>' for x, y, z in mesh.vertices)
    t = "\n".join(f'     <triangle v1="{a}" v2="{b}" v3="{c}"/>' for a, b, c in mesh.faces)
    return f"    <mesh>\n    <vertices>\n{v}\n    </vertices>\n    <triangles>\n{t}\n    </triangles>\n    </mesh>\n"


def build(stl, out_path, profiles, variant):
    mesh = trimesh.load(stl)
    c = mesh.bounds.mean(axis=0)
    mesh.apply_translation(-c)                         # object centred at origin
    hz = mesh.extents[2] / 2
    n_fil = 2 if variant == "AMS" else 1
    colours = [BLACK, WHITE] if n_fil == 2 else [BLACK]
    U = lambda: str(uuid.uuid4())
    obj_name = "UTAS_keychain"
    now = datetime.date.today().isoformat()

    model_main = f'''<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
 <metadata name="Application">BambuStudio-{APP_VERSION}</metadata>
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <metadata name="Title">UTAS keychain</metadata>
 <metadata name="CreationDate">{now}</metadata>
 <metadata name="ModificationDate">{now}</metadata>
 <resources>
  <object id="2" p:UUID="{U()}" type="model">
   <components>
    <component p:path="/3D/Objects/object_1.model" objectid="1" p:UUID="{U()}" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
   </components>
  </object>
 </resources>
 <build p:UUID="{U()}">
  <item objectid="2" p:UUID="{U()}" transform="1 0 0 0 1 0 0 0 1 128 128 {hz:.5f}" printable="1"/>
 </build>
</model>
'''
    model_obj = f'''<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021" xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06" requiredextensions="p">
 <metadata name="BambuStudio:3mfVersion">1</metadata>
 <resources>
  <object id="1" p:UUID="{U()}" type="model">
{mesh_xml(mesh)}  </object>
 </resources>
 <build/>
</model>
'''
    nf = len(mesh.faces)
    model_settings = f'''<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="2">
    <metadata key="name" value="{obj_name}"/>
    <metadata key="extruder" value="1"/>
    <metadata face_count="{nf}"/>
    <part id="1" subtype="normal_part">
      <metadata key="name" value="{obj_name}"/>
      <metadata key="matrix" value="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1"/>
      <metadata key="extruder" value="1"/>
      <mesh_stat face_count="{nf}" edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>
    </part>
  </object>
  <plate>
    <metadata key="plater_id" value="1"/>
    <metadata key="plater_name" value=""/>
    <metadata key="locked" value="false"/>
    <model_instance>
      <metadata key="object_id" value="2"/>
      <metadata key="instance_id" value="0"/>
      <metadata key="identify_id" value="101"/>
    </model_instance>
  </plate>
  <assemble>
   <assemble_item object_id="2" instance_id="0" transform="1 0 0 0 1 0 0 0 1 128 128 {hz:.5f}" offset="0 0 0" />
  </assemble>
</config>
'''
    if variant == "AMS":
        # type 2 = ToolChange -> switch to filament 2 (white)
        layer = f'<layer top_z="{CHANGE_Z}" type="2" extruder="2" color="{WHITE}" extra="" gcode="tool_change"/>'
        mode = "MultiAsSingle"
    else:
        # type 1 = PausePrint -> printer pauses, load white by hand
        layer = f'<layer top_z="{CHANGE_Z}" type="1" extruder="1" color="" extra="Load WHITE filament" gcode="M400 U1"/>'
        mode = "SingleExtruder"
    custom = f'''<?xml version="1.0" encoding="utf-8"?>
<custom_gcodes_per_layer>
<plate>
<plate_info id="1"/>
{layer}
<mode value="{mode}"/>
</plate>
</custom_gcodes_per_layer>
'''
    content_types = '''<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
 <Default Extension="png" ContentType="image/png"/>
</Types>
'''
    rels = '''<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>
'''
    model_rels = '''<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/Objects/object_1.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>
'''
    cfg = project_config(profiles, n_fil, colours)
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", content_types)
        z.writestr("_rels/.rels", rels)
        z.writestr("3D/3dmodel.model", model_main)
        z.writestr("3D/_rels/3dmodel.model.rels", model_rels)
        z.writestr("3D/Objects/object_1.model", model_obj)
        z.writestr("Metadata/model_settings.config", model_settings)
        z.writestr("Metadata/project_settings.config", json.dumps(cfg, indent=4, ensure_ascii=False))
        z.writestr("Metadata/custom_gcode_per_layer.xml", custom)
    print("wrote", out_path, f"({len(cfg)} settings)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--profiles", required=True)
    ap.add_argument("--stl", default=os.path.join(HERE, "out", "keychain_single.stl"))
    ap.add_argument("--name", default="UTAS_keychain_P2S_PLA")
    a = ap.parse_args()
    profs = load_profiles(a.profiles)
    for v in ("AMS", "noAMS"):
        build(a.stl, os.path.join(HERE, "out", f"{a.name}_{v}.3mf"), profs, v)
