# 最简单可靠的 Dockerfile - 专门针对 CI/CD 环境优化
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 复制所有文件到容器中（确保所有项目文件都被正确复制）
COPY . .

# 构建和发布
RUN dotnet restore "Gentle/Gentle.Web.Entry/Gentle.Web.Entry.csproj"
RUN dotnet publish "Gentle/Gentle.Web.Entry/Gentle.Web.Entry.csproj" -c Release -o /app/publish

# 运行时镜像
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

# 设置环境变量
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

# 暴露端口
EXPOSE 80

# 启动应用
ENTRYPOINT ["dotnet", "Gentle.Web.Entry.dll"]