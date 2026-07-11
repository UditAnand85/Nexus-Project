from flask import Flask
from flask_cors import CORS


def create_app(config_class=None) -> Flask:
    """
    Flask application factory.
    Creates and configures the Flask app instance.
    """
    app = Flask(__name__)

    # ─── Load Config ──────────────────────────────────────────────────────────
    if config_class:
        app.config.from_object(config_class)

    # ─── CORS ─────────────────────────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ─── Register Blueprints ──────────────────────────────────────────────────
    from app.routes.resume_routes import bp as resume_bp
    app.register_blueprint(resume_bp, url_prefix="/api/v1/resume")

    # ─── Health Check ─────────────────────────────────────────────────────────
    @app.route("/health")
    def health():
        return {
            "success": True,
            "status": "healthy",
            "service": "HireFlowAI Backend-2 (AI Resume Service)",
        }, 200

    # ─── Error Handlers ───────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return {"success": False, "message": "Route not found."}, 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {"success": False, "message": "Method not allowed."}, 405

    @app.errorhandler(500)
    def internal_error(e):
        return {"success": False, "message": "Internal server error."}, 500

    return app
