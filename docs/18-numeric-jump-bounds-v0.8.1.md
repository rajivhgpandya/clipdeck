# Numeric Jump Bounds v0.8.1

## Problema

Numeric Jump accettava sequenze numeriche arbitrariamente lunghe anche quando lo storico conteneva molti meno elementi.

Esempio:

con 37 elementi era possibile ottenere valori come:

`Jump: 48574289564375894326`

senza alcun significato operativo.

## Correzione

Il buffer numerico viene ora aggiornato soltanto se la posizione risultante esiste nello storico filtrato.

Esempio con 37 elementi:

- `3` -> valido
- `37` -> valido
- `38` -> ignorato
- `999` -> ignorato

La selezione e il valore visualizzato rimangono sull ultimo numero valido.

## Ambito

Il limite viene applicato a `filtered.length`.

Questo significa che Numeric Jump rispetta anche eventuali filtri di ricerca attivi.

## Versione

Clipdeck v0.8.1
