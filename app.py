from flask import Flask, render_template

app = Flask(__name__)

# Date columns between the Dentist/Insurance column and "Outstanding treatments", in order.
# Each is (name, months until it's due again after the date entered). None = never shows DUE.
DATE_COLUMNS = [
    ("Last Visit", None),
    ("Polish", 6),
    ("Fluoride", 6),
    ("Bitewings", 12),
    ("Periapicals", 12),
    ("Panoramic/STAT/iTero", 36),
    ("Perio Charting", 12),
    ("Recall Exam", 12),
]

# Date columns that get a No/Yes insurance switch under DUE (shown when the row's Insurance is Yes)
INSURANCE_COLUMNS = ["Polish", "Fluoride", "Recall Exam"]
# Date columns that say "ASK" (instead of a red DUE) once due but not covered by insurance
ASK_COLUMNS = ["Polish", "Fluoride", "Recall Exam"]
# ...and these also say "ASK" before they're due if insurance does cover them
ASK_EARLY_COLUMNS = ["Recall Exam"]
# Date columns whose DUE is colour-coded: green, yellow within 2 months of the due date, red once due
TRAFFIC_LIGHT_COLUMNS = ["Bitewings", "Periapicals", "Perio Charting"]


@app.route("/")
def index():
    insurance_cols = [i for i, (name, _) in enumerate(DATE_COLUMNS) if name in INSURANCE_COLUMNS]
    ask_cols = [i for i, (name, _) in enumerate(DATE_COLUMNS) if name in ASK_COLUMNS]
    ask_early_cols = [i for i, (name, _) in enumerate(DATE_COLUMNS) if name in ASK_EARLY_COLUMNS]
    light_cols = [i for i, (name, _) in enumerate(DATE_COLUMNS) if name in TRAFFIC_LIGHT_COLUMNS]
    return render_template("index.html", date_columns=DATE_COLUMNS, insurance_cols=insurance_cols,
                           ask_cols=ask_cols, ask_early_cols=ask_early_cols, light_cols=light_cols)


if __name__ == "__main__":
    app.run(debug=True)
