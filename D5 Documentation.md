## User Guide
### Logging In
1. Click on the login button in the top right of the home page
1. Enter your username and password
1. Click on the login button
### Creating a Ticket
1. Click on the submit a ticket button on the home page
1. Entered all the information required for the request such as the title, description, and priority
1. Click on the create a ticket button
### Tracking Tickets
1. On the home page, click on the track a ticket button
1. Navigate through your tickets or, if you are an administrator, all tickets
1. Ticket ID, status, category, priority, location, device, and updated status are displayed for easy access to the ticket information and its current status
1. Total number of tickets, in-progress tickets, and tickets awaiting a follow up are displayed at the top of ticket queue for quick viewing
### Tracking Assets (Admin Only)
1. Click on the track assets button on the home page
1. Navigate through the assets that are displayed on the asset list
1. Information on asset ID, type, model, location, status, warranty, and its assigned employee is shown on the page for each asset
### Tracking Licenses (Admin Only)
1. Click on the view license button on the asset tracking page
1. Navigate through the licenses displayed on the license list
1. Information on software name, vendor, total number of seats, seats in use, expiry, date purchased and actions are available on the page for each license 

## Project Plan

### Phase 1: Systems Request
In this phase, the team proposed an a IT ticketing and asset management system for the Summit Ridge Clothing Company

A systems request document was created outlining:
- business need
- business requirements
- business values
- special issues and constraints
- feasibility analysis
- cost-benefit analysis for a 3-year period
- project methodology
- project work plan

This phase also established the project sponsor as well as the key shareholders


### Phase 2: Requirements Definition Document and Use Cases
In this phase, the team created a requirements document and outlined use cases for the system

The key outputs of the requirements document included:
- Functional requirements
- Non-functional requirements
- Interview summaries on people in various positons
- Observation notes of the existing ("as-is") system
- A document analysis

12 use cases were produced through use case analysis, but a diagram was created for only 5 key use cases


### Phase 3: Project Database Creation
During this phase, the team created the project database based on the previously developed use cases

The end products for this phase were:
- SQL script to intialize the database
- Database tables
- SQL inserts for sample data
- A Docker Compose file so that the database could run in a container

This database is managed through the team's project repository on GitHub


### Phase 4: Data Modeling and Starting Design
In this phase, the team expanded the system design by developing the data model and system architecture

Key components include:
- An ER Diagram in the third normal form (3NF)
- An alternative matrix for custom development decisions
- The system architecture design
- System architecture diagrams

This phase ensures that the system design supports scalability, maintainability, and security requirements


### Phase 5: Closing: User Interface Design, Program design and System Implementation
In this final phase, the system was implemented and demonstrated

Deliverables for this phase include: 
- User interface prototypes for 5 most important screens
- The creation of functional webpages
- A UI that stores data matching database tables
- Forms and reports connected to the database
- A GitHub repository that contains the full source code for the system
- Docker Container deployment using GitHub actions and DockerHub

The complete system was put in a container and prepared for live demonstration and user testing