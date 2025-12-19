# LMS System Flowcharts

## 1. Authentication Flow
This module handles user access and security.

```mermaid
graph TD
    A[Start] --> B{Has Account?}
    B -- No --> C[Registration Page]
    C --> D[Enter Details]
    D --> E{Valid Input?}
    E -- No --> D
    E -- Yes --> F[Create Account]
    F --> G[Redirect to Login]
    
    B -- Yes --> H[Login Page]
    H --> I[Enter Username/Email & Password]
    I --> J{Authenticate}
    J -- Fail --> H
    J -- Success --> K{Check Role}
    K -- Admin --> L[Admin Dashboard]
    K -- Borrower --> M[User Dashboard]
```

## 2. Librarian (Admin) Workflow
The Admin manages the system, inventory, and transactions.

```mermaid
graph TD
    A[Admin Dashboard] --> B[Manage Inventory]
    B --> B1[Add New Books]
    B --> B2[Update Stock]
    
    A --> C[Manage Borrowers]
    C --> C1[View List]
    C --> C2[Remove Borrower]
    
    A --> D[Transactions]
    D --> D1[Issue Book (Borrow)]
    D --> D2[Return Book]
    
    D1 --> E[Update System Records]
    D2 --> E
```

## 3. Borrower (User) Workflow
Borrowers use the system to browse resources and get information.

```mermaid
graph TD
    A[User Dashboard] --> B[Browse Catalog]
    B --> B1[Search Books]
    B --> B2[Filter by Category]
    B --> B3[Check Availability]
    
    A --> C[AI Assistant]
    C --> C1[Ask Question]
    C --> C2[Get Response]
    
    A --> D[Logout]
```

## 4. Complete System Overview

```mermaid
graph TD
    User((User))
    
    subgraph Auth
        Login[Login Page]
        Register[Register Page]
    end
    
    subgraph Admin_Panel
        AD[Admin Dashboard]
        Inv[Inventory Mgmt]
        Trans[Issue/Return]
    end
    
    subgraph User_Panel
        UD[User Dashboard]
        Cat[Book Catalog]
        Chat[AI Chat]
    end
    
    User --> Login
    User --> Register
    Register --> Login
    
    Login -- Admin --> AD
    Login -- Borrower --> UD
    
    AD --> Inv
    AD --> Trans
    
    UD --> Cat
    UD --> Chat
```
