package io.github.olivierlemasle.planningOnpl

import com.google.api.client.auth.oauth2.AuthorizationCodeFlow
import com.google.api.client.auth.oauth2.AuthorizationCodeResponseUrl
import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.extensions.appengine.auth.oauth2.AbstractAppEngineAuthorizationCodeCallbackServlet
import com.google.api.client.extensions.appengine.auth.oauth2.AbstractAppEngineAuthorizationCodeServlet
import com.google.api.client.extensions.appengine.datastore.AppEngineDataStoreFactory
import com.google.api.client.extensions.appengine.http.UrlFetchTransport
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets
import com.google.api.client.http.GenericUrl
import com.google.api.client.http.HttpTransport
import com.google.api.client.json.jackson2.JacksonFactory
import com.google.api.services.calendar.Calendar
import com.google.api.services.calendar.CalendarScopes
import com.google.appengine.api.users.UserServiceFactory
import java.io.InputStreamReader
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

class AuthorizationServlet : AbstractAppEngineAuthorizationCodeServlet() {

    override fun doGet(request: HttpServletRequest, response: HttpServletResponse) {
        response.sendRedirect("/")
    }

    override fun getRedirectUri(req: HttpServletRequest): String = Utils.getRedirectUri(req)

    override fun initializeFlow(): AuthorizationCodeFlow = Utils.newFlow()
}

class OAuth2Callback : AbstractAppEngineAuthorizationCodeCallbackServlet() {

    override fun onSuccess(req: HttpServletRequest, resp: HttpServletResponse, credential: Credential) {
        resp.sendRedirect("/last")
    }

    override fun onError(req: HttpServletRequest, resp: HttpServletResponse, errorResponse: AuthorizationCodeResponseUrl) {
        val nickname = UserServiceFactory.getUserService().currentUser.nickname
        resp.writer.print("<h3>$nickname, why don't you want to play with me?</h1>")
        resp.status = 200
        resp.addHeader("Content-Type", "text/html")
    }

    override fun getRedirectUri(req: HttpServletRequest): String = Utils.getRedirectUri(req)

    override fun initializeFlow(): AuthorizationCodeFlow = Utils.newFlow()
}

internal object Utils {
    private val jacksonFactory: JacksonFactory = JacksonFactory.getDefaultInstance()
    private val httpTransport: HttpTransport = UrlFetchTransport()

    private val clientCredential: GoogleClientSecrets by lazy {
        val clientSecretsStream = Utils::class.java.getResourceAsStream("/client_secrets.json")
        GoogleClientSecrets.load(jacksonFactory, InputStreamReader(clientSecretsStream))
    }

    fun getRedirectUri(req: HttpServletRequest): String {
        val url = GenericUrl(req.requestURL.toString())
        url.rawPath = "/api/oauth2callback"
        return url.build()
    }

    fun newFlow(): GoogleAuthorizationCodeFlow = GoogleAuthorizationCodeFlow
            .Builder(httpTransport, jacksonFactory, clientCredential, listOf(CalendarScopes.CALENDAR))
            .setDataStoreFactory(AppEngineDataStoreFactory.getDefaultInstance())
            .setAccessType("online")
            .build()

    fun loadGCalendarClient(): Calendar? {
        val userId = UserServiceFactory.getUserService()
                .currentUser
                ?.userId
        val credential = newFlow().loadCredential(userId)
                ?: return null
        return Calendar
                .Builder(httpTransport, jacksonFactory, credential)
                .setApplicationName("Planning ONPL")
                .build()
    }

    fun deleteGCalendarCredential() {
        val userId = UserServiceFactory.getUserService().currentUser.userId
        newFlow().credentialDataStore.delete(userId)
    }

    fun revokeGCalendarAccess(): Boolean {
        return try {
            val userId = UserServiceFactory.getUserService().currentUser.userId
            val flow = newFlow()

            // Revoke
            val token = flow.loadCredential(userId).accessToken
            val url = GenericUrl("https://accounts.google.com/o/oauth2/revoke?token=$token")
            httpTransport.createRequestFactory()
                    .buildGetRequest(url)
                    .execute()

            // Remove saved credential
            flow.credentialDataStore.delete(userId)

            true
        } catch (e: Exception) {
            false
        }
    }
}
