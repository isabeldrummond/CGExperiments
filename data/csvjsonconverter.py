# Hi, assuming your data is not currently in json format (it should be), 
# here is a converter for you to run. Check line 42 for instructions.

import csv
import json

def parse_value(value):
    """Convert strings to int or float when possible."""
    if value is None:
        return None

    value = value.strip()
    if value == "":
        return value

    # Try int
    try:
        return int(value)
    except ValueError:
        pass

    # Try float
    try:
        return float(value)
    except ValueError:
        pass

    return value


def csv_to_json(csv_file_path, json_file_path):
    with open(csv_file_path, mode="r", encoding="utf-8", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        rows = [
            {key: parse_value(value) for key, value in row.items()}
            for row in reader
        ]

    with open(json_file_path, mode="w", encoding="utf-8") as json_file:
        json.dump(rows, json_file, indent=4)

# HERE IS WHERE ACTION IS NEEDED, 
# find your csv to convert, and name the outputted json either "cities.csv" or "actions.csv"
# 
# If you are using a different name, the rest of the code will not understand you. 
#       If you're using a different name because you're trying to show something new? 
#       Good luck with Chart.js documentation and stack overflow :)

if __name__ == "__main__":
    csv_input = "/Users/isabeldrummond/CGExperiments/data/cities.csv"
    json_output = "cities.json"
    csv_to_json(csv_input, json_output)

# Run the script! You're done! :)
# A new json file should be here in the data folder.

# if you're enncountering a "FileNotFoundError", 
# make sure your json is here in the data folder.
