FROM node:current

# Create runner user
RUN useradd -m -d /home/projects-bot -s /bin/bash projects-bot
RUN mkdir /opt/projects-bot && chown projects-bot /opt/projects-bot -R

# Copy files, install and compile
COPY . /opt/projects-bot
WORKDIR /opt/projects-bot
RUN npm ci
RUN npm run build

# Start
USER projects-bot
CMD [ "node", "." ]