from metric_bank import MetricBank

metrics = MetricBank()


def main():
    # Run the function
    example_function_1(100000)
    print(metrics.get_metrics())

    example_function_2(100000)
    print(metrics.get_metrics())

    example_function_3(100000)
    print(metrics.get_metrics())


@metrics.measure_execution_time
@metrics.measure_memory
def example_function_1(n):
    # Some example computation
    result = sum(i * i for i in range(n))
    return result


@metrics.measure_execution_time
@metrics.measure_memory
def example_function_2(n):
    # a larg list comprehension
    result = [i * i for i in range(n)]
    return result


@metrics.measure_execution_time
@metrics.measure_memory
def example_function_3(n: int) -> int:
    # a diffecult math calculation
    if n < 0:
        raise ValueError("n must be >= 0")

    p = [0] * (n + 1)
    p[0] = 1

    for k in range(1, n + 1):
        total = 0
        m = 1
        while True:
            g1 = m * (3 * m - 1) // 2
            g2 = m * (3 * m + 1) // 2
            if g1 > k:
                break
            sign = -1 if (m % 2 == 0) else 1
            total += sign * p[k - g1]
            if g2 <= k:
                total += sign * p[k - g2]
            m += 1
        p[k] = total

    return p[n]


if __name__ == "__main__":
    main()
