from flask import Flask, render_template

app = Flask(__name__)

# Date columns between the Dentist/Insurance column and "Outstanding treatments", in order.
DATE_COLUMNS = [
    "Last Visit",
    "Polish",
    "Fluoride",
    "Bitewings",
    "Periapicals",
    "Panoramic/STAT/iTero",
    "Perio Charting",
    "Recall Exam",
]


@app.route("/")
def index():
    return render_template("index.html", date_columns=DATE_COLUMNS)


if __name__ == "__main__":
    app.run(debug=True)
