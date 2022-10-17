import requests
from datetime import datetime, timezone
from dateutil import parser, tz

# This script will fail if it is given a person born before 0 BCE

# This will assume you mean the "most famous" person by the given name

FAMOUS_PERSON = "Mikhail Yeryomin"
YOUR_BIRTHDAY = "1994-09-18"


def main():
    query_params = {
        "action": "query",
        "list": "search",
        "format": "json",
        "srsearch": FAMOUS_PERSON,
    }
    r = requests.get("https://www.wikidata.org/w/api.php", params=query_params)

    response = r.json()

    if len(response["query"]["search"]) == 0:
        print(f"No such person found on Wikidata")
        return

    first_result_id = response["query"]["search"][0]["title"]

    entity = requests.get(
        f"https://www.wikidata.org/entity/{first_result_id}.json"
    ).json()

    claims = entity["entities"][first_result_id]["claims"]

    if "P569" not in claims:
        print(f"No birth date found for {FAMOUS_PERSON}")
        return

    birth_date_raw = claims["P569"][0]["mainsnak"]["datavalue"]["value"]["time"]

    try:
        birth_date = parser.isoparse(birth_date_raw[1:])
    except:
        print(f"Failed to parse birth date: {birth_date_raw}")
        return

    if "P570" not in claims:
        death_date = None
    else:
        death_date_raw = claims["P570"][0]["mainsnak"]["datavalue"]["value"]["time"]

        death_date = parser.isoparse(death_date_raw[1:])

    if not death_date:
        print(f"{FAMOUS_PERSON} isn't dead yet according to Wikidata! (birth date: {birth_date})")
        return

    days_them_alive = (death_date - birth_date).days

    now = datetime.now(timezone.utc)
    birthday = parser.parse(YOUR_BIRTHDAY)
    birthday = birthday.replace(tzinfo=tz.gettz("UTC"))
    days_you_alive = (now - birthday).days

    if days_them_alive > days_you_alive:
        print(
            f"You have {str(days_them_alive - days_you_alive)} days left before you outlive {FAMOUS_PERSON}!"
        )
    else:
        print(
            f"Congratulations! You've outlived {FAMOUS_PERSON} by {days_you_alive - days_them_alive} days"
        )


if __name__ == "__main__":
    main()
