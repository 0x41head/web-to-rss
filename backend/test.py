import psycopg2
from psycopg2 import Error
from typing import Dict, List, Union

def create_table(
    db_params: Dict[str, str],
    table_name: str,
    columns: List[Dict[str, str]],
    drop_existing: bool = False
) -> bool:
    """
    Create a table in PostgreSQL database.

    Args:
        db_params (dict): Database connection parameters
        table_name (str): Name of the table to create
        columns (list): List of dictionaries containing column definitions
        drop_existing (bool): Whether to drop the table if it already exists

    Returns:
        bool: True if table creation was successful, False otherwise

    Example:
        columns = [
            {"name": "id", "type": "SERIAL PRIMARY KEY"},
            {"name": "username", "type": "VARCHAR(50) UNIQUE NOT NULL"},
            {"name": "email", "type": "VARCHAR(100) UNIQUE NOT NULL"},
            {"name": "created_at", "type": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"}
        ]
    """
    connection = None
    try:
        # Establish connection
        connection = psycopg2.connect(**db_params)
        cursor = connection.cursor()

        if drop_existing:
            cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
            print(f"Dropped table {table_name} if it existed")

        # Construct column definitions
        column_definitions = []
        for column in columns:
            column_definitions.append(f"{column['name']} {column['type']}")

        # Create the CREATE TABLE statement
        create_table_query = f"""
            CREATE TABLE {table_name} (
                {','.join(column_definitions)}
            )
        """

        # Execute the query
        cursor.execute(create_table_query)

        # Commit the transaction
        connection.commit()
        print(f"Table {table_name} created successfully")
        return True

    except (Exception, Error) as error:
        print(f"Error while creating table: {error}")
        return False

    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

def create_table_with_constraints(
    db_params: Dict[str, str],
    table_name: str,
    schema: Dict[str, Union[str, Dict[str, str]]],
    constraints: List[str] = None,
    drop_existing: bool = False
) -> bool:
    """
    Create a table with additional constraints and foreign keys.

    Args:
        db_params (dict): Database connection parameters
        table_name (str): Name of the table to create
        schema (dict): Dictionary containing column definitions and constraints
        constraints (list): Additional table constraints
        drop_existing (bool): Whether to drop the table if it already exists
    """
    connection = None
    try:
        connection = psycopg2.connect(**db_params)
        cursor = connection.cursor()

        if drop_existing:
            cursor.execute(f"DROP TABLE IF EXISTS {table_name}")

        # Build the column definitions including constraints
        columns = []
        for col_name, col_def in schema.items():
            if isinstance(col_def, str):
                columns.append(f"{col_name} {col_def}")
            else:
                col_str = f"{col_name} {col_def['type']}"
                if 'constraints' in col_def:
                    col_str += f" {col_def['constraints']}"
                columns.append(col_str)

        # Add any table-level constraints
        if constraints:
            columns.extend(constraints)

        create_table_query = f"""
            CREATE TABLE {table_name} (
                {','.join(columns)}
            )
        """

        cursor.execute(create_table_query)
        connection.commit()
        print(f"Table {table_name} created successfully with constraints")
        return True

    except (Exception, Error) as error:
        print(f"Error while creating table: {error}")
        return False

    finally:
        if connection:
            cursor.close()
            connection.close()
            print("Database connection closed.")

# Example usage
if __name__ == "__main__":
    # Database connection parameters
    db_params = {
        "dbname": "postgres",
        "user": "postgres",
        "password": "postgres",
        "host": "localhost",
        "port": "5432"
    }

    # Example 1: Simple table creation
    columns = [
        {"name": "id", "type": "SERIAL PRIMARY KEY"},
        {"name": "username", "type": "VARCHAR(50) UNIQUE NOT NULL"},
        {"name": "email", "type": "VARCHAR(100) UNIQUE NOT NULL"},
        {"name": "created_at", "type": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"}
    ]

    create_table(db_params, "users", columns, drop_existing=True)

    # Example 2: Complex table with constraints
    orders_schema = {
        "order_id": "SERIAL PRIMARY KEY",
        "user_id": {
            "type": "INTEGER",
            "constraints": "NOT NULL"
        },
        "total_amount": {
            "type": "DECIMAL(10,2)",
            "constraints": "NOT NULL CHECK (total_amount >= 0)"
        },
        "order_date": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    }

    table_constraints = [
        "FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"
    ]

    create_table_with_constraints(
        db_params,
        "orders",
        orders_schema,
        constraints=table_constraints,
        drop_existing=True
    )
