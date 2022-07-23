# Random++
[English](https://github.com/MasterNaxum/foundryvtt-random-plus-plus/blob/main/README.md)  |  [Spanish](https://github.com/MasterNaxum/foundryvtt-random-plus-plus/blob/main/README.es.md)

Slightly changes pseudo-random number generation in mysterious ways.

This FoundryVTT Module gives clients slightly different options to alter their Random Number Generation. It does so by modifying the `int()` method of the MersenneTwister's class definition (used to generate random numbers). The method's intent is to return a 32 bit number (between 0 and 2^32-1), which is then used by the implementation in all other rng related queries of the application (mainly, rolling dice).

Use the following manifest to install the latest version:

    https://raw.githubusercontent.com/MasterNaxum/foundryvtt-random-plus-plus/main/module.json

The options available are as follow.  

## Mersenne Twister (Original)
Makes no changes to the RNG generation. This is the default value. Uses the Mersenne Twister implementation of FoundryVTT.

## Mersenne - Reseed after every roll
This option will take the intended result calculated by the Mersenne Twister, and before returning it, it will re-seed the twister.

The new seed is the XOR of the last 32 bits of `Date.now()` (time of the roll) and the result that is actually returned.

**Why use this?**
Reseeding after every roll will re-calculate the state of the Mersenne Twister. Since we are setting a random seed that originates from the current time of the roll and the already arbitrary last roll, there should not be much of a difference from the original method.

## Mersenne - Reseed before every roll
This option will re-seed the Mersenne Twister before rolling.

The new seed is the XOR of the last 32 bits of `Date.now()` (time of the roll) and the last result returned by the Mersenne Twister.

**Why use this?**
Reseeding before every roll using a random seed that originates from the current time of the roll and the already arbitrary last roll should make the new roll less "predictable", since it will be dependant on the exact time the roll took place.

## Javascript - Math.random
This option will use the current javascript implementation of the Math.random method to determine the next random result. 

Most browsers have an implementation of [Xorshift128+](https://en.wikipedia.org/wiki/Xorshift#xorshift.2B) for their Math.random method definition.

**Why use this?**
This is an alternative that ignores the Mersenne algorythm altogether and instead uses the browser's choice of implementing randomness. Mersenne Twister has failed in some statistical tests in the past whereas Xorshift has passed. Both methods have pros and cons and Xorshift is an alternative to Mersenne that is popular enough of a choice to end up in most browsers.

## Quantum RNG - Bulk (qrng.anu.edu.au)
This option will skip using the Mersenne Twister for the most part, leaving the RNG generation to making requests to the website https://qrng.anu.edu.au/.

It will save a number of values that originate from quantum readings at the **Centre for Quantum Computing and Communication Technology** of **The Australian National University** at **Canberra**.

Through the settings of this module, set how many numbers to request at a time to keep in memory. When the time comes to roll, the next number on the list is used, and then removed from the list. If the list ever shrunks more than the specified setting, a request will be made to fill the list with a number equal to the specified setting. If there aren't any numbers left on the list, we default to calling the default Mersenne Twister method and we make sure to send a request for more numbers, which may or may not come in time for the next call.

**Why use this?**
Reading quantum fluctuations is theoretically more random than any pseudo-random generator algorythm out there. It is "true randomness". We should ask the ANU for data in bulks in order to not saturate their servers by making a request for every single individual roll that we want.

Detaching the RNG generation from the client is also arguably better.

<font color="red">**WARNING!**</font>
The QRNG project is migrating to a paid service hosted on Amazon Web Services https://quantumnumbers.anu.edu.au/ and have announced that their public API is to be scaled back and retired. I have not found a suitable replacement that is free and open and requires no authentication like their original API. If you do, please leave that knowledge somewhere in the repo.