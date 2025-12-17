import json
import pandas as pd
import io
import base64

def read_metrics(file_data, date):
    """
    Process Excel file and extract care gap metrics.
    
    Args:
        file_data: File bytes or file path
        date: Date parameter for the result
        
    Returns:
        Dictionary with metrics counts and date
    """
    # Handle both bytes and file paths
    if isinstance(file_data, bytes):
        df = pd.read_excel(io.BytesIO(file_data))
    else:
        df = pd.read_excel(file_data)
    
    # Use case-insensitive substring/regex matching against the 'Care Gap' column
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

    # Format the result as a dictionary
    result = {
        'diabetes': num_diabetes,
        'blood_pressure': num_blood_pressure,
        'breast_cancer': num_breast_cancer,
        'colorectal_cancer': num_colorectal_cancer,
        'date': date
    }
    
    return result


def lambda_handler(event, context):
    """
    AWS Lambda handler function for processing Excel files.
    
    Expected event structure:
    {
        'excel_file': '<base64-encoded-file-data>',
        'date_param': '<date-string>'
    }
    """
    try:
        # Extract parameters from event
        excel_file_data = event.get('excel_file')
        date_param = event.get('date_param', '')
        is_base64 = event.get('is_base64', True)
        
        if not excel_file_data:
            return {
                'statusCode': 400,
                'body': json.dumps({"error": "Missing excel_file parameter"})
            }
        
        # Decode base64 if needed
        if is_base64 and isinstance(excel_file_data, str):
            excel_file_data = base64.b64decode(excel_file_data)
        
        # Process the Excel file
        result = read_metrics(excel_file_data, date_param)
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    except ValueError as e:
        return {
            'statusCode': 400,
            'body': json.dumps({"error": str(e), "message": "Validation error"})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({"error": str(e), "message": "Python processing error"})
        }