# Auto Assess Platform

This system enables automated testing and assessment of multi-component learning projects. It features a web interface for instructors to manage evaluations and a submission endpoint for students to trigger builds and tests of their assignments.

## Requirements

❯ Docker & Docker Compose

❯ `.env` config setup (see dotenv)

## Setup

```bash
git clone https://github.com/CaCuCkA/auto-assess-platform.git
cd auto-assess-platform
```

```bash
cp dotenv .env  # Create environment config from template
```
Edit the newly created .env file and fill in required values for PostgreSQL, Jenkins, Gemini API, and service ports. Each variable is documented inside `dotenv` using inline comments.

```bash 
docker-compose up --build
```
Then open http://localhost:PORT in your browser (default port is defined in .env).


## Project Structure
```bash
auto-assess-platform/
├── backend/             # Quart backend handling API requests and processing
├── frontend/            # Handlebars-based frontend for instructors and students
├── jenkins/             # Jenkinsfiles and job configuration templates
├── database/            # PostgreSQL schema and initialization scripts
├── docker-compose.yml   # Docker Compose setup for all services
└── dotenv     
```

## Usage Overview

### Teacher Flow

* Create Homework groups, add participants and define test cases.

* Review and optionally edit AI-generated feedback.

* Approve, reject, or comment on student submissions.


### Student Flow

* Submitting a GitHub pull request is treated as a homework submission event.

* The system triggers Jenkins to build and test the project.

* Receive automated or teacher-reviewed feedback.

## Demo

Watch a short video walkthrough of the Auto Assess Platform in action: [Click here to view the demo](https://www.youtube.com/watch?v=ZwPVliRJ_4E&feature=youtu.be)