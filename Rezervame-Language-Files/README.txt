REZERVAME — LANGUAGE FILES
============================

This folder contains the English and Spanish UI text used in the live app.

STRUCTURE
---------
mobile/
  en.json   — Mobile app (Android / iOS), English
  es.json   — Mobile app (Android / iOS), Spanish

web/
  en.json   — Customer website + Business portal, English
  es.json   — Customer website + Business portal, Spanish

Admin panel is English only at this stage. Labels are defined directly in the Admin source code.

FORMAT
------
Each file is standard JSON. Every line is a key/value pair:

  "searchBtn": "Search"
  "searchBtn": "Buscar"

The key stays the same in both languages. Only the text on the right changes.

HOW TO REQUEST CHANGES
----------------------
1. Open the JSON file for the platform (mobile or web) and language (en or es).
2. Find the key you want to change, or send us the English text as it appears on screen.
3. We update the file, run the normal build, and deploy.

Do not rename keys unless a developer updates the code that references them.

SOURCE LOCATION IN THE PROJECT
------------------------------
Mobile:  Mobile/assets/translations/
Web:     shared/locales/

Both language files in each pair should stay in sync (same keys in en and es).

NOTES
-----
- Panama Spanish (es-PA) is used for dates and currency formatting in the app.
- Some business category names come from the database and Admin settings, not from these files.
- After edits, Mobile needs a new app build; Web and Admin need a Firebase deploy.

Contact the development team for deployment after translation updates.
