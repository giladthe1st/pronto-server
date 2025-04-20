# Database Documentation

## Overview
This documentation describes a database system for a restaurant deals platform. The database consists of four main tables: Deals, Users, RoleTypes, and Restaurants, with an additional Restaurant_Categories table for categorization.

## Tables and Relationships

### Deals Table
- **id** (int, primary key)
- **created_at** (timestamp)
- **details** (varchar)
- **summarized_deal** (varchar)
- **price** (float)
- **restaurant_id** (int, foreign key referencing Restaurants.id)
- **restaurant_name** (varchar)

This table stores information about deals offered by restaurants.

### Users Table
- **id** (int, primary key)
- **created_at** (timestamp)
- **password** (varchar)
- **email** (varchar)
- **role** (int, foreign key referencing RoleTypes.id)

This table manages user accounts in the system.

### RoleTypes Table
- **id** (int, primary key)
- **created_at** (timestamp)
- **role_type** (varchar)

This table defines the different roles users can have in the system.

### Restaurants Table
- **id** (int, primary key)
- **created_at** (timestamp)
- **name** (varchar)
- **logo_url** (varchar)
- **website_url** (varchar)
- **reviews_count** (numeric)
- **average_rating** (float)
- **address** (varchar)
- **maps_url** (varchar)
- **latitude** (float)
- **longitude** (float)

This table contains comprehensive information about restaurants.

### Restaurant_Categories Table
- **id** (int, primary key)
- **created_at** (timestamp)
- **category_name** (category type)
- **restaurant_id** (int, foreign key referencing Restaurants.id)

This table associates restaurants with categories.

## Relationships
- A Deal belongs to a Restaurant (via restaurant_id)
- A User has a Role (via role)
- A Restaurant can have multiple Deals
- A Restaurant can belong to multiple Categories (via Restaurant_Categories)

## Data Types
- **int**: Integer values
- **timestamp**: Date and time values
- **varchar**: Variable-length character strings
- **float**: Floating-point numbers
- **numeric**: Precise numeric values
- **category**: Custom type for category names

This database structure supports restaurant listing, categorization, user management, and deal offerings for a restaurant deals platform.