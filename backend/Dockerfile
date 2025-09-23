# Use the official .NET runtime as a base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000
EXPOSE 5001

# Install Node.js for frontend development (if needed)
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs

# Use the SDK to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["backend/MisionMaestra.API.csproj", "backend/"]
RUN dotnet restore "backend/MisionMaestra.API.csproj"

# Copy the rest of the files and build
COPY . .
WORKDIR "/src/backend"
RUN dotnet build "MisionMaestra.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MisionMaestra.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create database directory and set permissions
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_GID /app/data

# Environment variables
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:5000/api/health || exit 1

ENTRYPOINT ["dotnet", "MisionMaestra.API.dll"]