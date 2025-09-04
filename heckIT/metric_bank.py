import time
import tracemalloc
from functools import wraps
from typing import Callable


class MetricBank:
    def __init__(self):
        self.execution_time = 0
        self.memory_usage = 0
        self.output_value = None

    def measure_execution_time(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            self.execution_time = time.time() - start_time
            self.output_value = result
            return result

        return wrapper

    def measure_memory(self, func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracemalloc.start()
            result = func(*args, **kwargs)
            current, peak = tracemalloc.get_traced_memory()
            self.memory_usage = peak / 1024 / 1024  # Convert to MB
            tracemalloc.stop()
            return result

        return wrapper

    def get_metrics(self) -> dict:
        return {
            "execution_time": f"{self.execution_time:.4f} seconds",
            "memory_usage": f"{self.memory_usage:.2f} MB",
            # "output_value": self.output_value,
        }
