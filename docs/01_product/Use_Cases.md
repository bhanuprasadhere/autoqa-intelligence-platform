# Use Cases

## UC-01: Automated Exploratory Scan
* **Actor:** QA Engineer
* **Trigger:** User inputs a URL and clicks "Start Scan."
* **Flow:**
    1.  System validates URL accessibility.
    2.  System crawls the homepage and identifies all clickable elements.
    3.  System maps out the navigation tree (Page A -> Page B).
    4.  System logs the number of screens and input fields found.
* **Outcome:** A "Surface Map" of the application is created.

## UC-02: Form & Input Stress Testing
* **Actor:** System (Autonomous)
* **Trigger:** System identifies an input form (e.g., Contact Us).
* **Flow:**
    1.  System identifies fields: Name, Email, Phone.
    2.  System generates inputs:
        * Valid: "John Doe", "john@test.com"
        * Invalid: Empty string, Special characters, SQL injection snippets.
        * Edge: 5000 characters of text.
    3.  System submits form for each case.
    4.  System monitors for crashes, 500 errors, or successful submissions.
* **Outcome:** A log of which inputs caused failures or unexpected success.

## UC-03: Broken Link & Flow Detection
* **Actor:** System (Autonomous)
* **Trigger:** During navigation.
* **Flow:**
    1.  System clicks a "Next" button.
    2.  System waits for page load.
    3.  If 404/500 error occurs, log as Critical Bug.
    4.  If page redirects to an unexpected location, log as Warning.
* **Outcome:** A list of broken user flows.

## UC-04: Report Generation
* **Actor:** QA Engineer
* **Trigger:** Scan completion.
* **Flow:**
    1.  User navigates to "Reports" section.
    2.  User selects the latest run.
    3.  System displays summary (Pass/Fail rate).
    4.  System allows export to JSON or PDF.
* **Outcome:** Actionable intelligence on system health.