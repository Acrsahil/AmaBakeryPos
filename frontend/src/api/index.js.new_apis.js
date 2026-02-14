
export async function addItemActivity(productId, type, activityData) {
    const token = localStorage.getItem("access");
    // type is either 'add' or 'reduce'
    const url = apiBaseUrl + `/api/itemactivity/${productId}/${type}/`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(activityData),
    });

    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.message || "Failed to modify product");
    return data;
}

export async function fetchItemActivity(productId) {
    const token = localStorage.getItem("access");
    const url = apiBaseUrl + `/api/itemactivity/${productId}/detail/`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.message || "Failed to fetch item activity");
    return data.data;
}
