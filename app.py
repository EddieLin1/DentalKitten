from flask import Flask, render_template

app = Flask(__name__)

# Date columns between the Dentist/Insurance column and "Outstanding treatments", in order.
# Each is (name, months until it's due again after the date entered). None = never shows DUE.
DATE_COLUMNS = [
    ("Last Visit", None),
    ("Polish", 6),
    ("Fluoride", 6),
    ("Bitewings", 12),
    ("Periapicals", 36),
    ("Panoramic/STAT/iTero", 60),
    ("Perio Charting", 12),
    ("Recall Exam", 6),
]


@app.route("/")
def index():
    return render_template("index.html", date_columns=DATE_COLUMNS)


if __name__ == "__main__":
    app.run(debug=True)
