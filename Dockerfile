# Dockerfile extending the generic Node image with application files for a
# single application.
FROM gcr.io/google_appengine/nodejs

# Installs puppeteer dependencies package.
RUN apt-get update && apt-get install -y \
        build-essential \
        software-properties-common \
        ca-certificates \
        byobu curl git htop man unzip vim wget \
        sudo \
        gconf-service \
        libasound2 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libcurl3 \
        libexif-dev \
        libgconf-2-4 \
        libglib2.0-0 \
        libgl1-mesa-dri \
        libgl1-mesa-glx \
        libgtk-3.0 \
        libnspr4 \
        libnss3 \
        libpango1.0-0 \
        libv4l-0 \
        libxss1 \
        libxtst6 \
        libxrender1 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxi6 \
        libxrandr2 \
        libxft2 \
        libfreetype6 \
        libc6 \
        zlib1g \
        libpng12-0 \
        wget \
        apt-utils \
        xdg-utils \
        --no-install-recommends

COPY . /app/
# You have to specify "--unsafe-perm" with npm install
# when running as root.  Failing to do this can cause
# install to appear to succeed even if a preinstall
# script fails, and may have other adverse consequences
# as well.
# This command will also cat the npm-debug.log file after the
# build, if it exists.
RUN npm config set unsafe-perm true && npm install --unsafe-perm || \
  ((if [ -f npm-debug.log ]; then \
      cat npm-debug.log; \
    fi) && false)

CMD npm start
