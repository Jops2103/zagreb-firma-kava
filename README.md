# Zagreb Firma Kava — web-prototip

Mobilno prilagođena statična početna stranica s odjeljcima za kapsule, aparate, poslovne korisnike i naručivanje.

## Sadržaj
- `index.html` — struktura i hrvatski tekstovi
- `styles.css` — dizajn prilagođen mobitelima i računalima
- `script.js` — izbornik, priprema narudžbe i WhatsApp povezivanje

## Obavezno prije objave
1. U `script.js` upišite poslovni WhatsApp broj u `WHATSAPP_NUMBER` u međunarodnom formatu, samo znamenke (npr. `3859XXXXXXXX`).
2. Povežite obrazac s pouzdanom uslugom za zaprimanje obrazaca/e-mailova. Trenutačni obrazac ne sprema niti automatski šalje podatke. Privremena `mailto` varijanta nije isto što i automatsko slanje s poslužitelja.
3. Dodajte podatke prodavatelja, uvjete prodaje i isporuke, politiku privatnosti i potrebne zakonske obavijesti.
4. Potvrdite pravo uporabe naziva/brenda Lavazza i nemojte se predstavljati kao službeni distributer bez ovlaštenja.
5. Zamijenite CSS ilustraciju aparata/kave stvarnim fotografijama za koje imate prava te dodajte stvarne proizvode i cijene.
6. Testirajte naručivanje na telefonu prije javne objave.

## Pregled
Otvorite `index.html` u pregledniku. Za objavu prenesite sve datoteke u korijenski direktorij odabranog statičkog hostinga. Projekt nema build korak.

## Ograničenje ove verzije
Ovo je front-end prototip. Obrazac trenutno ne šalje niti pohranjuje narudžbe. Potrebno je spojiti servis za obrasce ili backend prije korištenja s pravim kupcima.
