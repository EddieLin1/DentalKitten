"""Reads the text files in notes/ into rows for the locked notes pages.

The files are parsed on every unlock, so edits to them show up without restarting the app.
"""
import base64
import mimetypes
import re
from pathlib import Path

NOTES_DIR = Path(__file__).parent / "notes"

# "Medical History: No Changes" -> ("Medical History", "No Changes"). Short labels only, so
# sentences that happen to contain a colon stay whole.
LABEL = re.compile(r"^([A-Za-z][^:*]{0,40}):\s*(.*)$")


def _lines(name):
    return (NOTES_DIR / name).read_text(encoding="utf-8").splitlines()


def oral_hygiene():
    """[(topic, instructions)] from "Topic: instructions" lines."""
    rows = []
    for line in _lines("oral_hygiene_instructions.txt"):
        topic, sep, text = line.partition(":")
        if sep and text.strip():
            rows.append((topic.strip(), text.strip()))
    return rows


def _template_rows(lines):
    rows, gap = [], False
    for line in lines:
        line = line.strip()
        if not line:
            gap = bool(rows)   # a blank line starts a new group of rows
            continue
        m = LABEL.match(line)
        rows.append({
            "label": m[1] if m else "",
            "value": m[2] if m else line,
            "gap": gap,
            "optional": line.startswith("***"),
        })
        gap = False
    return rows


def hygiene_templates():
    """Each template runs from "HYGIENE THERAPY for" to the "RDH:" line. The line(s) above it name it:
    two lines = group + name ("Airpolishing" / "SCALE + POLISH"), one line = name in the same group."""
    templates, title, body, group, name = [], [], None, "", ""

    def finish():
        text = "\n".join(line.rstrip() for line in body).strip()
        templates.append({"group": group, "name": name, "text": text, "rows": _template_rows(body)})

    for raw in _lines("hygiene_note_templates.txt"):
        line = raw.rstrip()
        if body is None:
            if line.startswith("HYGIENE THERAPY"):
                if len(title) > 1:
                    group = title[0]
                name = title[-1] if title else "Template"
                body, title = [line], []
            elif line.strip():
                title.append(line.strip())
        else:
            body.append(line)
            if line.startswith("RDH:"):
                finish()
                body = None
    if body:
        finish()
    return templates


def injections():
    """Sections of nerve blocks (N: nerve, A: area, L: landmarks, A: needle/depth/volume)
    plus the local anesthetics section (name, drug, relative max, absolute max, duration)."""
    lines = [line.strip() for line in _lines("injections_notes.txt")]
    # The notes are pasted in twice: keep only the first copy
    first = next((line for line in lines if line), "")
    repeat = [i for i, line in enumerate(lines) if line == first]
    if len(repeat) > 1:
        lines = lines[:repeat[1]]

    sections, section, block, drug = [], None, None, None
    for i, line in enumerate(lines):
        if not line:
            continue
        after = next((nxt for nxt in lines[i + 1:] if nxt), "")
        m = re.match(r"^([NAL]):\s*(.*)$", line)
        if after.startswith("N:"):                               # a nerve block's name
            block = {"name": line, "nerve": [], "area": [], "landmarks": [], "needle": [], "notes": []}
            block["_last"] = "nerve"
            section["blocks"].append(block)
        elif drug and re.search(r"\bhours?\b", line, re.I):     # a local anesthetic's duration
            drug["duration"] = line
        elif not m and (i == 0 or not lines[i - 1] or i + 1 < len(lines) and not lines[i + 1]):
            # a heading: set apart by a blank line above or below
            section = {"title": line, "blocks": [], "drugs": []}
            sections.append(section)
            block = drug = None
        elif block:
            if m:
                field = {"N": "nerve", "L": "landmarks"}.get(m[1]) or ("needle" if block["area"] else "area")
                if field == "area" and not m[2]:
                    block["area"].append("")   # placeholder so a second "A:" is still the needle
                elif m[2]:
                    block[field].append(m[2])
                block["_last"] = field
            elif block["needle"]:
                block["notes"].append(line)                      # e.g. BONY CONTACT REQUIRED
            else:
                block[block["_last"]].append(line)               # continuation of the last field
        else:                                                    # local anesthetics
            if m := re.match(r"^Relative maximum dose\s*(.*)$", line, re.I):
                drug["relative"] = m[1]
            elif m := re.match(r"^Absolute maximum dose\s*(.*)$", line, re.I):
                drug["absolute"] = m[1]
            elif drug is None or drug["formulation"]:
                drug = {"name": line, "formulation": "", "relative": "", "absolute": "", "duration": ""}
                section["drugs"].append(drug)
            else:
                drug["formulation"] = line

    for section in sections:
        for block in section["blocks"]:
            block.pop("_last")
            block["area"] = [line for line in block["area"] if line]
    return sections


def image_data_uri(name):
    """The image inlined into the page, so it only reaches people who know the password."""
    path = NOTES_DIR / name
    if not path.is_file():
        return None
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"
