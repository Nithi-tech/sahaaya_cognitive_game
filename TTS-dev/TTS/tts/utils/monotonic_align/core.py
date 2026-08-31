"""
Pure-Python fallback for the Cython ``monotonic_align.core`` extension.

The compiled extension is only used during *training* of Glow-TTS /
VITS models.  XTTS-v2 inference never calls ``maximum_path_c``, so a
no-op stub is enough to let the package install and import cleanly on
Windows without requiring Microsoft C++ Build Tools.
"""

import numpy as np


def maximum_path_c(paths, values, t_xs, t_ys, max_neg_val=-1e9):
    """Pure-Python implementation of the monotonic alignment search.

    Args:
        paths  (np.ndarray): int32  [B, T_x, T_y] — output alignment paths
        values (np.ndarray): float32 [B, T_x, T_y] — log-prob values
        t_xs   (np.ndarray): int32  [B] — lengths along x axis
        t_ys   (np.ndarray): int32  [B] — lengths along y axis
        max_neg_val (float): large negative sentinel value
    """
    b = values.shape[0]
    for i in range(b):
        _maximum_path_each(paths[i], values[i], int(t_xs[i]), int(t_ys[i]), max_neg_val)


def _maximum_path_each(path, value, t_x, t_y, max_neg_val):
    """Single-item monotonic alignment search (pure Python/NumPy)."""
    for y in range(t_y):
        for x in range(max(0, t_x + y - t_y), min(t_x, y + 1)):
            v_cur = max_neg_val if x == y else float(value[x, y - 1])
            if x == 0:
                v_prev = 0.0 if y == 0 else max_neg_val
            else:
                v_prev = float(value[x - 1, y - 1])
            value[x, y] = max(v_cur, v_prev) + value[x, y]

    index = t_x - 1
    for y in range(t_y - 1, -1, -1):
        path[index, y] = 1
        if index != 0 and (index == y or value[index, y - 1] < value[index - 1, y - 1]):
            index -= 1
