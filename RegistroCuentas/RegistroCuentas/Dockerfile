#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/azure-functions/dotnet:4 AS base
WORKDIR /home/site/wwwroot
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src
COPY ["./RegistroCuentas.csproj", "RegistroCuentas/"]
RUN dotnet restore "RegistroCuentas/RegistroCuentas.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "RegistroCuentas.csproj" -c Release -o /app/build

# RUN apt update -y
# RUN apt upgrade -y
# RUN apt install curl -y
# RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
# RUN apt install nodejs -y
# RUN npm install -g azure-functions-core-tools@3 --unsafe-perm true
# CMD func start --port 80

FROM build AS publish
RUN dotnet publish "RegistroCuentas.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /home/site/wwwroot
COPY --from=publish /app/publish .
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true