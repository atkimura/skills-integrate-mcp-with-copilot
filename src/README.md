# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Teachers can sign in before managing enrollment
- Sign up and unregister students from activities in teacher mode

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## Teacher Login

Teacher credentials are stored in [src/teachers.json](src/teachers.json).

Sample accounts:

- Username: `mrodriguez` Password: `falcon-hall-monitor`
- Username: `lchen` Password: `robotics-lab-2026`

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/auth/me`                                                        | Get the current teacher login state                                 |
| POST   | `/auth/login`                                                     | Log in as a teacher                                                 |
| POST   | `/auth/logout`                                                    | Log out the current teacher                                         |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up a student for an activity as a teacher                      |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student from an activity as a teacher               |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

Activity data is stored in memory, which means activity changes reset when the server restarts.
Teacher credentials are loaded from `teachers.json`.
