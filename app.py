from flask import Flask, render_template

app = Flask(__name__)

DATE_COLUMNS = 6


@app.route("/")
def index():
    return render_template("index.html", date_columns=DATE_COLUMNS)


if __name__ == "__main__":
    app.run(debug=True)
