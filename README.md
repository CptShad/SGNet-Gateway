# Stargazer Network: Gateway

## Table of Contents

-   [Stargazer Network: Gateway](#stargazer-network-gateway)
    -   [Table of Contents](#table-of-contents)
    -   [Overview](#overview)
    -   [Features](#features)
    -   [Architecture](#architecture)
    -   [How It Works](#how-it-works)
    -   [Getting Started](#getting-started)
        -   [Prerequisites](#prerequisites)
        -   [Installation](#installation)
        -   [Configuration](#configuration)
        -   [Running the Gateway](#running-the-gateway)
    -   [API Endpoints](#api-endpoints)
    -   [Scaling and Performance](#scaling-and-performance)
    -   [Future Enhancements](#future-enhancements)
    -   [Contributing](#contributing)
    -   [License](#license)

## Overview

Stargazer Network Gateway is an advanced wrapper for the Ollama / OpenAI API standard, implementing a master-worker paradigm for efficient request processing. This gateway acts as a sophisticated load balancer, distributing tasks across multiple worker nodes to enhance performance and scalability.

## Features

-   Master-worker architecture for distributed processing
-   Redis-based queue system for efficient load balancing
-   Support for streaming responses
-   Horizontal scalability for both gateway and worker nodes
-   Compatible with Ollama and OpenAI API standards

## Architecture

The Stargazer Network Gateway consists of two main components:

1. **Gateway (Master)**: Handles incoming requests and distributes them to worker nodes.
2. **Workers**: Process requests and generate responses.

Here's a high-level diagram of the system architecture:

<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="780" height="380" fill="#f0f0f0" stroke="#000000" stroke-width="2"/>
  <rect x="30" y="30" width="200" height="80" fill="#ff9999" stroke="#000000" stroke-width="2"/>
  <text x="130" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="14">Gateway (Master)</text>
  <rect x="300" y="30" width="200" height="80" fill="#99ccff" stroke="#000000" stroke-width="2"/>
  <text x="400" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="14">Redis Queue</text>
  <rect x="570" y="30" width="200" height="80" fill="#99ff99" stroke="#000000" stroke-width="2"/>
  <text x="670" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="14">Worker Node 1</text>
  <rect x="570" y="150" width="200" height="80" fill="#99ff99" stroke="#000000" stroke-width="2"/>
  <text x="670" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="14">Worker Node 2</text>
  <rect x="570" y="270" width="200" height="80" fill="#99ff99" stroke="#000000" stroke-width="2"/>
  <text x="670" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="14">Worker Node N</text>
  <path d="M230 70 H300" fill="none" stroke="#000000" stroke-width="2" marker-end="url(#arrowhead)"/>
  <path d="M500 70 H570" fill="none" stroke="#000000" stroke-width="2" marker-end="url(#arrowhead)"/>
  <path d="M500 70 L535 190 H570" fill="none" stroke="#000000" stroke-width="2" marker-end="url(#arrowhead)"/>
  <path d="M500 70 L535 310 H570" fill="none" stroke="#000000" stroke-width="2" marker-end="url(#arrowhead)"/>
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" />
    </marker>
  </defs>
</svg>

## How It Works

1. **Request Ingestion**: The gateway receives API requests and pushes them into a Redis queue.
2. **Task Distribution**: Worker nodes consume tasks from the Redis queue.
3. **Processing**: Each worker processes the request using the Ollama/OpenAI API.
4. **Response Handling**:
    - A unique task ID is assigned to each request.
    - A Redis subscriber is created for each task ID.
    - Workers publish results to the corresponding Redis channel.
    - The gateway collects responses and streams them back to the client.
5. **Completion**: Once the response is fully processed, the API returns the result, and the Redis subscriber is closed.

This architecture ensures efficient load distribution and enables horizontal scaling of both the gateway and worker nodes.

## Getting Started

### Prerequisites

-   [Bun](https://bun.sh/) runtime
-   [Redis](https://redis.io/) server
-   [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) (for development)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/SGNet-Gateway.git
    ```

2. Navigate to the project directory:

    ```bash
    cd SGNet-Gateway
    ```

3. Install dependencies:
    ```bash
    bun install
    ```

### Configuration

1. Copy the `.env.example` file to `.env`:

    ```bash
    cp .env.example .env
    ```

2. Edit the `.env` file and set the appropriate values for your environment, especially the Redis connection details.

### Running the Gateway

Start the gateway:

```bash
bun run start
```

By default, the gateway runs on `http://localhost:3000`.

## API Endpoints

The gateway exposes the following endpoints:

-   `POST /api/generate`: For text generation requests
-   `POST /api/chat`: For chat-based interactions

Refer to the API documentation for detailed request and response formats.

## Scaling and Performance

The Stargazer Network Gateway is designed for horizontal scalability:

-   Multiple gateway instances can be deployed behind a load balancer.
-   Worker nodes can be added or removed dynamically to adjust processing capacity.
-   Redis cluster can be set up for high availability and performance.

## Future Enhancements

-   Implement [Exo](https://github.com/exo-explore/exo) to support running large models more efficiently.
-   Add authentication and rate limiting.
-   Implement advanced monitoring and logging.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE).
