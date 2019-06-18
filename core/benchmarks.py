import subprocess

counts = [5, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000]
dims = [10, 25, 50, 100, 200, 500, 1000]

for count in counts:
    for dim in dims:
        print("Running random benchmark count {0} dim {1}".format(count, dim))
        subprocess.run(
            [
                "python3",
                "./benchmark.py",
                "random",
                str(count),
                str(dim),
                "5",
                "./benchmarks/stress-test-sparse/ct-{0}-dim-{1}.csv".format(count, dim),
            ]
        )

