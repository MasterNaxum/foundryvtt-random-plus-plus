
# Random++
[Inglés](https://github.com/MasterNaxum/foundryvtt-random-plus-plus/blob/main/README.md) | [Español](https://github.com/MasterNaxum/foundryvtt-random-plus-plus/blob/main/README.es.md)

Modifica la generación de números pseudo-aleatorios de manera misteriosa.

Este módulo para FoundryVTT ofrece a los clientes opciones ligeramente diferentes para alterar su generación de números aleatorios. Lo hace modificando el método `int` de la clase MerseneTwister (usada para generar números aleatorios). El método tiene como objetivo retornar un número de 32 bits (entre 0 y 2^32-1), que luego se utiliza en en todas las llamadas de la aplicación que lo piden (principalmente, tirar dados).

Usa el siguiente manifesto para instalar la última versión:

    https://raw.githubusercontent.com/MasterNaxum/foundryvtt-random-plus-plus/main/module.json

The options available are as follow.  

## Mersenne Twister (Original)
No cambia la generación de números aleatorios. Este es el valor por defecto. Usa el método de la implementación del Mersenne Twister de FoundryVTT.

## Mersenne - Resembrar tras cada tirada
Esta opción cogerá el resultado del Mersenne Twister, y antes de retornarla, resembrará (reinicializará) el propio twister.

La nueva semilla será la XOR de los últimos 32 bits de `Date.now()` (la hora de la tirada) y el resultado que se va a retornar.

**¿Por qué usar esta opción?**
Resembrar tras cada tirada recalculará el estado del Mersenne Twister. Como la semilla se genera a partir de la hora de la tirada y el último resultado arbitrario, no debería haber mucha diferencia con respecto al método original sin modificar..

## Mersenne - Resembrar tras cada tirada
Esta opción resembrará (reinicializará) el Mersenne Twister antes de cada tirada. 

La nueva semilla será la XOR de los últimos 32 bits de `Date.now()` (la hora de la tirada) y el último resultado generado.

**¿Por qué usar esta opción?**
Resembrar antes de cada tirada usando una semilla que proviene de la hora de la tirada y del último resultado arbitrario debería hacer la tirada resultante menos "predecible", puesto que dependerá del tiempo exacto en el que la tirada tuvo lugar.

## Javascript - Math.random
Esta opción usará la implementación actual de javascript de Math.random para determinar el siguiente resultado.

La mayoría de navegadores tienen una implementación de Xorshift128+ para su definición de Math.random.

**¿Por qué usar esta opción?**
Esta es una alternativa que ignora el algoritmo del Mersenne por completo y en su lugar usa la implementación del navegador para generar números aleatorios. El Mersenne Twister ha fallado en algunos tests estatísticos en el pasado mientras que Xorshift los ha superado. Ambos métodos tienen sus pros y sus contras y Xorshift es una alternativa a Mersenne que es lo bastante popular como para aparecer en la mayoría de navegadores.

## Quantum RNG - Petición múltiple (qrng.anu.edu.au)
Esta opción evitará usar el algoritmo de Mersenne Twister en su mayoría, dejando la generación de números aleatorios a la página https://qrng.anu.edu.au/.

Guardará un número de valores que originarán de lecturas cuánticas procedentes del **Centro de Computación Cuántira y Tecnología de Comunicaciones** de la **Universidad Nacional Australiana** en **Canberra**.

A través de la configuración de este módulo, selecciona cuántos números solicitar cada vez que se pidan para guardar en memoria. Cuando toque hacer una tirada, el siguiente número en la lista es usado y quitado de la lista. Si la lista se hace más pequeña que el tamaño especificado en la configuración, se hará una nueva petición para llenar la lista con un número igual al que aparece en la configuración. Si no hay más números en la lista, se usará por defecto el resultado del Mersenne Twister original y se pedirán más números, que podrían haber llegado o no para la siguiente vez que realizamos una tirada.

**¿Por qué usar esta opción?**
Leer fluctuaciones cuánticas es teóricamente más aleatorio que cualquier generador de números pseudo-aleatorios que exista. Es "aleatoriedad verdadera". Deberíamos pedir a la Universidad Nacional Australiana los datos en peticiones que pidan más de un número a la vez para evitar saturar sus servidores haciendo una petición por cada tirada individual.

Separar la generación de números aleatorios del cliente es debatiblemente mejor en general.

<font  color="red">**¡ADVERTENCIA!**</font>
El proyecto QRNG está migrando a un modelo de pago hosteado en Amazon Web Services https://quantumnumbers.anu.edu.au/ y han anunciado que su API pública se reducirá en escala y retirará. No he sido capaz de encontrar una alternativa viable que sea gratuita, de código abierto, y que no requiera autentificación como su API original. Si encuentras una alternativa, por favor deja ese conocimiento en algún lugar de este repositorio.