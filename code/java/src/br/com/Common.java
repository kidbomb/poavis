package br.com;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.net.URLConnection;

public class Common {
	public static String getSiteAsString(String url) throws IOException{
        URL site = new URL(url );
        URLConnection siteConnection = site.openConnection();
        InputStream in =  siteConnection.getInputStream();

        BufferedReader reader = new BufferedReader( new InputStreamReader(in));
        String         line = null;
        StringBuilder  stringBuilder = new StringBuilder();
        String         ls = System.getProperty("line.separator");

        while( ( line = reader.readLine() ) != null ) {
            stringBuilder.append( line );
            stringBuilder.append( ls );
        }
        reader.close();
        
        return stringBuilder.toString();
	}
}
