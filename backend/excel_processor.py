import sys
import json
import pandas as pd

if __name__ == '__main__':
    try:

        file_path = sys.argv[1]
        date_param = sys.argv[2]
        
        df = pd.read_excel(file_path)
        
        # --- YOUR CUSTOM PANDAS LOGIC GOES HERE ---
        # We'll use case-insensitive substring/regex matching against the 'Care Gap' column
        # to count rows for each metric. This is more tolerant of small wording variations.
        metrics_patterns = {
            'diabetes': r'Hemoglobin A1C|A1C|Hemoglobin A1c',
            'blood_pressure': r'Blood Pressure|Controlling Blodd Pressure|Controlling Blood Pressure|BP',
            'breast_cancer': r'Breast Cancer',
            'colorectal_cancer': r'Colorectal Cancer|Colorectal'
        }

        # Ensure expected column exists
        if 'Care Gap' not in df.columns:
            raise ValueError("Expected column 'Care Gap' not found in the Excel file")

        # Normalize to string and perform case-insensitive pattern matching
        care_gap_series = df['Care Gap'].astype(str)

        num_diabetes = int(care_gap_series.str.contains(metrics_patterns['diabetes'], case=False, na=False).sum())
        num_blood_pressure = int(care_gap_series.str.contains(metrics_patterns['blood_pressure'], case=False, na=False).sum())
        num_breast_cancer = int(care_gap_series.str.contains(metrics_patterns['breast_cancer'], case=False, na=False).sum())
        num_colorectal_cancer = int(care_gap_series.str.contains(metrics_patterns['colorectal_cancer'], case=False, na=False).sum())

        # 3. Format the result as JSON and print to stdout
        # The result must be a JSON object that Node.js can parse.
        result = {
            'diabetes': num_diabetes,
            'blood_pressure': num_blood_pressure,
            'breast_cancer': num_breast_cancer,
            'colorectal_cancer': num_colorectal_cancer,
            'date': date_param
        }
        
        json.dump(result, sys.stdout)
        
    except Exception as e:
        # Print a JSON error structure to stderr or stdout for Node.js to catch
        sys.stderr.write(json.dumps({"error": str(e), "message": "Python processing error"}))
        sys.exit(1)