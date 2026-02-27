import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export const exportToCSV = async (filename: string, data: any[], headers?: string[]) => {
    if (!data || data.length === 0) {
        throw new Error("No data available to export.");
    }

    // Get headers from first object if not provided
    const keys = headers || Object.keys(data[0]);

    // Construct CSV string
    const csvRows = [];
    // Heading row
    csvRows.push(keys.join(","));

    // Build rows
    for (const row of data) {
        const values = keys.map((key) => {
            let val = row[key];
            // Convert nested objects/arrays to string gracefully
            if (val === null || val === undefined) val = "";
            else if (typeof val === "object") val = JSON.stringify(val).replace(/"/g, '""');
            else val = String(val).replace(/"/g, '""');

            // Escape commas, newlines, and quotes
            if (val.includes(",") || val.includes("\n") || val.includes('"')) {
                return `"${val}"`;
            }
            return val;
        });
        csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");
    const fileUri = `${FileSystem.documentDirectory}${filename}.csv`;

    try {
        // Write the CSV file
        await FileSystem.writeAsStringAsync(fileUri, csvString, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        // Check if sharing is available (not supported on web by default, but we're on RN)
        if (!(await Sharing.isAvailableAsync())) {
            throw new Error("Sharing is not available on this device.");
        }

        // Share the file
        await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Export CSV Data",
            UTI: "public.comma-separated-values-text", // For iOS
        });
    } catch (error) {
        console.error("Error exporting CSV:", error);
        throw error;
    }
};
