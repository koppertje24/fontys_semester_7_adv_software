import timeit


def main():
    tijd = timeit.timeit("mijn_functie()", globals=globals(), number=100)
    print(f"Gemiddelde tijd per run: {tijd / 100:.6f} seconden")


def mijn_functie(n=100000):
    # a larg list comprehension
    result = [i * i for i in range(n)]
    return result


if __name__ == "__main__":
    main()
