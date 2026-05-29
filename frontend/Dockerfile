# Frontend pré-buildé localement (npm run build) puis servi par nginx.
# Cette approche évite les bugs récurrents npm sur les optionalDependencies
# natives (rolldown, lightningcss, tailwindcss-oxide).
# Voir : https://github.com/npm/cli/issues/4828
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
