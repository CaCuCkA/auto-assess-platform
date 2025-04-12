# Use official PostgreSQL image
FROM postgres:13

# Set working directory
WORKDIR /database

# Copy init.sql into the container's PostgreSQL init directory
COPY database/init.sql /docker-entrypoint-initdb.d/

# Expose PostgreSQL default port
EXPOSE 5432
